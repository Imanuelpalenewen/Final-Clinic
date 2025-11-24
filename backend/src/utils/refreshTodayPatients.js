import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '../../../database/klinik_sentosa.db');

console.log('🔄 Refresh Today\'s Patients with Fixed Names\n');

const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

const hashPassword = (password) => bcrypt.hashSync(password, 10);
const defaultPassword = hashPassword('123');

// Get today's date in local time
const today = new Date();
const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

console.log(`📅 Today's date: ${todayStr}\n`);

// ========== DELETE OLD TODAY'S PATIENTS ==========
console.log('🗑️  Deleting old today\'s patients...\n');

// Find patients created today
const todayPatients = db.prepare(`
  SELECT p.id, p.name, p.no_rm, p.user_id, q.id as queue_id
  FROM patients p
  LEFT JOIN queue q ON q.patient_id = p.id
  WHERE DATE(p.created_at) = ?
`).all(todayStr);

console.log(`Found ${todayPatients.length} patients from today to clean up:\n`);

todayPatients.forEach(patient => {
  console.log(`  Deleting: ${patient.name} (${patient.no_rm})`);
  
  try {
    // Delete will cascade to queue, prescriptions, transactions
    db.prepare('DELETE FROM patients WHERE id = ?').run(patient.id);
    
    // Delete user account if exists
    if (patient.user_id) {
      db.prepare('DELETE FROM users WHERE id = ?').run(patient.user_id);
    }
    
    console.log(`    ✅ Deleted patient and related data`);
  } catch (error) {
    console.log(`    ⚠️  Error: ${error.message}`);
  }
});

console.log('\n✅ Cleanup completed!\n');

// ========== SEED NEW TODAY'S PATIENTS WITH CORRECT NAMES ==========
console.log('🌱 Seeding NEW today\'s patients with proper names...\n');

const generateNoRM = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  const maxRm = db.prepare(
    `SELECT no_rm FROM patients WHERE no_rm LIKE ? ORDER BY no_rm DESC LIMIT 1`
  ).get(`RM-${dateStr}-%`);

  let nextNum = 1;
  if (maxRm) {
    const lastNum = parseInt(maxRm.no_rm.split('-')[2]);
    nextNum = lastNum + 1;
  }

  return `RM-${dateStr}-${String(nextNum).padStart(3, '0')}`;
};

const getNextQueueNumber = (date) => {
  const dateStr = date.toISOString().split('T')[0];
  
  const maxQueue = db.prepare(
    `SELECT COALESCE(MAX(queue_number), 0) as max_num 
     FROM queue 
     WHERE DATE(created_at) = ?`
  ).get(dateStr);

  return (maxQueue.max_num || 0) + 1;
};

const createPatient = (patientData, queueData) => {
  const insertUser = db.prepare(
    'INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)'
  );
  
  const no_rm = generateNoRM(today);
  const userResult = insertUser.run(no_rm, defaultPassword, patientData.name, 'patient');
  const userId = userResult.lastInsertRowid;

  const insertPatient = db.prepare(
    'INSERT INTO patients (user_id, no_rm, name, dob, gender, address, phone) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  const patientResult = insertPatient.run(
    userId, no_rm, patientData.name, patientData.dob, patientData.gender, 
    patientData.address, patientData.phone
  );
  const patientId = patientResult.lastInsertRowid;

  const queueNumber = getNextQueueNumber(today);
  const insertQueue = db.prepare(
    `INSERT INTO queue (queue_number, patient_id, is_emergency, complaint, status, diagnosis, doctor_notes, total_cost, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  
  const queueResult = insertQueue.run(
    queueNumber, patientId, queueData.is_emergency || 0, queueData.complaint,
    queueData.status, queueData.diagnosis || null, queueData.doctor_notes || null,
    queueData.total_cost || 0, today.toISOString(), today.toISOString()
  );
  const queueId = queueResult.lastInsertRowid;

  // Add prescriptions if applicable
  if (queueData.status !== 'waiting' && queueData.status !== 'doctor' && queueData.medicines) {
    const insertPrescription = db.prepare(
      'INSERT INTO prescriptions (queue_id, medicine_id, quantity) VALUES (?, ?, ?)'
    );
    queueData.medicines.forEach(medId => {
      insertPrescription.run(queueId, medId, 10);
    });
  }

  // Add transaction if completed
  if (queueData.status === 'completed' && queueData.total_cost) {
    const insertTransaction = db.prepare(
      'INSERT INTO transactions (queue_id, total_amount, payment_method, created_at) VALUES (?, ?, ?, ?)'
    );
    insertTransaction.run(queueId, queueData.total_cost, 'cash', today.toISOString());
  }

  return { no_rm, queueNumber, patientId };
};

// Data pasien HARI INI dengan nama yang benar (tanpa status di nama)
const todayPatientsData = [
  // 2 waiting
  {
    patient: { name: 'Andi Setiawan', dob: '1990-01-01', gender: 'L', address: 'Jl. Kebon Jeruk No. 15, Jakarta', phone: '08111111001' },
    queue: { complaint: 'Demam tinggi 3 hari', status: 'waiting', is_emergency: 0 }
  },
  {
    patient: { name: 'Budi Prasetyo', dob: '1991-02-02', gender: 'L', address: 'Jl. Gatot Subroto No. 88, Jakarta', phone: '08111111002' },
    queue: { complaint: 'Batuk berdahak', status: 'waiting', is_emergency: 1 }
  },
  // 2 doctor
  {
    patient: { name: 'Citra Dewi', dob: '1992-03-03', gender: 'P', address: 'Jl. Sudirman No. 123, Jakarta', phone: '08111111003' },
    queue: { complaint: 'Sakit kepala berkepanjangan', status: 'doctor', is_emergency: 0 }
  },
  {
    patient: { name: 'Dian Permata', dob: '1993-04-04', gender: 'P', address: 'Jl. Thamrin No. 45, Jakarta', phone: '08111111004' },
    queue: { complaint: 'Flu dan pilek', status: 'doctor', is_emergency: 0 }
  },
  // 2 pharmacy
  {
    patient: { name: 'Eko Saputra', dob: '1994-05-05', gender: 'L', address: 'Jl. Melawai No. 67, Jakarta', phone: '08111111005' },
    queue: { complaint: 'Maag kambuh', status: 'pharmacy', is_emergency: 0, diagnosis: 'Gastritis', doctor_notes: 'Hindari makanan pedas', medicines: [1, 4], total_cost: 15000 }
  },
  {
    patient: { name: 'Fitri Handayani', dob: '1995-06-06', gender: 'P', address: 'Jl. Kemang Raya No. 22, Jakarta', phone: '08111111006' },
    queue: { complaint: 'Alergi kulit gatal', status: 'pharmacy', is_emergency: 0, diagnosis: 'Alergi Makanan', doctor_notes: 'Hindari seafood', medicines: [2, 22], total_cost: 20000 }
  },
  // 1 cashier
  {
    patient: { name: 'Gita Lestari', dob: '1996-07-07', gender: 'P', address: 'Jl. Menteng No. 99, Jakarta', phone: '08111111007' },
    queue: { complaint: 'Pusing berputar', status: 'cashier', is_emergency: 0, diagnosis: 'Migrain', doctor_notes: 'Istirahat cukup', medicines: [22], total_cost: 25000 }
  },
  // 1 completed
  {
    patient: { name: 'Hadi Gunawan', dob: '1997-08-08', gender: 'L', address: 'Jl. Cikini No. 33, Jakarta', phone: '08111111008' },
    queue: { complaint: 'Batuk kering', status: 'completed', is_emergency: 0, diagnosis: 'ISPA', doctor_notes: 'Banyak minum air putih', medicines: [2, 11], total_cost: 30000 }
  }
];

todayPatientsData.forEach((data, index) => {
  const result = createPatient(data.patient, data.queue);
  console.log(`  ✅ ${data.patient.name} → ${data.queue.status} (${result.no_rm})`);
});

console.log('\n📊 Final Summary:');
const counts = {
  queueToday: db.prepare("SELECT COUNT(*) as c FROM queue WHERE DATE(created_at) = ?").get(todayStr).c,
  patientsToday: db.prepare("SELECT COUNT(*) as c FROM patients WHERE DATE(created_at) = ?").get(todayStr).c
};

console.log(`  👥 Patients Today: ${counts.patientsToday}`);
console.log(`  📋 Queue Today: ${counts.queueToday}`);

console.log('\n✅ Refresh completed!');
console.log('🔑 All passwords: 123\n');

db.close();
