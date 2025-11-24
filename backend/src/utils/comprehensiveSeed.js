import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '../../../database/klinik_sentosa.db');
const SCHEMA_PATH = path.join(__dirname, '../../../database/schema.sql');

console.log('🚀 Comprehensive Seeding - Klinik Sentosa\n');

const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

// Check if tables exist
const tableExists = (tableName) => {
  const result = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name=?"
  ).get(tableName);
  return !!result;
};

// Create tables if not exist
if (!tableExists('users')) {
  console.log('📝 Creating tables from schema...');
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  db.exec(schema);
  console.log('✅ Tables created\n');
}

// Ensure gender column exists
try {
  db.exec("ALTER TABLE patients ADD COLUMN gender VARCHAR(1) CHECK(gender IN ('L', 'P'))");
  console.log('✅ Added gender column\n');
} catch (error) {
  // Column already exists
}

const hashPassword = (password) => bcrypt.hashSync(password, 10);
const defaultPassword = hashPassword('123');

// ========== 1. CLEANUP DUPLICATE MEDICINES ==========
console.log('🧹 Cleaning up duplicate medicines...');

// Find medicines used in prescriptions
const usedMedicines = db.prepare(`
  SELECT DISTINCT medicine_id FROM prescriptions
`).all().map(r => r.medicine_id);

// Find duplicates
const duplicates = db.prepare(`
  SELECT name, COUNT(*) as count, GROUP_CONCAT(id) as ids
  FROM medicines
  GROUP BY name
  HAVING count > 1
`).all();

duplicates.forEach(dup => {
  const ids = dup.ids.split(',').map(Number);
  console.log(`  🔍 Found duplicate: "${dup.name}" (${dup.count} copies)`);
  
  // Keep one that's used in prescriptions, or keep the first one
  let keepId = ids[0];
  for (const id of ids) {
    if (usedMedicines.includes(id)) {
      keepId = id;
      break;
    }
  }
  
  // Delete others
  const toDelete = ids.filter(id => id !== keepId);
  toDelete.forEach(id => {
    db.prepare('DELETE FROM medicines WHERE id = ?').run(id);
    console.log(`    ❌ Deleted duplicate ID: ${id}`);
  });
  console.log(`    ✅ Kept ID: ${keepId}`);
});

console.log('✅ Duplicate cleanup complete\n');

// ========== 2. SEED STAFF USERS (CONDITIONAL) ==========
console.log('👥 Seeding staff users...');

const staffUsers = [
  { username: 'admin', full_name: 'Administrator', role: 'admin' },
  { username: 'doctor', full_name: 'Dr. Jane Smith', role: 'doctor' },
  { username: 'pharmacist', full_name: 'John Pharmacist', role: 'pharmacist' },
  { username: 'owner', full_name: 'Clinic Owner', role: 'owner' }
];

const insertUser = db.prepare(
  'INSERT OR IGNORE INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)'
);

staffUsers.forEach(user => {
  const result = insertUser.run(user.username, defaultPassword, user.full_name, user.role);
  if (result.changes > 0) {
    console.log(`  ✅ Created: ${user.username}`);
  } else {
    console.log(`  ℹ️  Exists: ${user.username}`);
  }
});

// ========== 3. CREATE USER ACCOUNTS FOR EXISTING PATIENTS ==========
console.log('\n🔗 Creating accounts for existing patients...');

const patientsWithoutUser = db.prepare(
  'SELECT id, no_rm, name FROM patients WHERE user_id IS NULL'
).all();

patientsWithoutUser.forEach(patient => {
  const userResult = insertUser.run(patient.no_rm, defaultPassword, patient.name, 'patient');
  if (userResult.changes > 0) {
    const userId = userResult.lastInsertRowid;
    db.prepare('UPDATE patients SET user_id = ? WHERE id = ?').run(userId, patient.id);
    console.log(`  ✅ ${patient.name} (${patient.no_rm})`);
  }
});

// ========== 4. SEED MEDICINES (CONDITIONAL) ==========
console.log('\n💊 Seeding medicines...');

const medicines = [
  { name: 'Paracetamol 500mg', stock: 500, unit: 'tablet', price: 500 },
  { name: 'Amoxicillin 500mg', stock: 200, unit: 'kapsul', price: 1500 },
  { name: 'OBH Combi Anak', stock: 45, unit: 'botol', price: 18000 },
  { name: 'Vitamin C 500mg', stock: 350, unit: 'tablet', price: 1000 },
  { name: 'Betadine 30ml', stock: 30, unit: 'botol', price: 25000 },
  { name: 'Oralit', stock: 100, unit: 'unit', price: 2000 },
  { name: 'Promag', stock: 150, unit: 'tablet', price: 1000 },
  { name: 'Sangobion', stock: 120, unit: 'kapsul', price: 2500 },
  { name: 'Termometer', stock: 15, unit: 'unit', price: 75000 },
  { name: 'Asam Mefenamat', stock: 300, unit: 'tablet', price: 800 },
  { name: 'Bodrexin Sirup', stock: 50, unit: 'botol', price: 12000 },
  { name: 'Kasa Steril', stock: 80, unit: 'unit', price: 5000 },
  { name: 'Masker Medis 3-Ply', stock: 1000, unit: 'unit', price: 1500 },
  { name: 'Ibuprofen 400mg', stock: 250, unit: 'tablet', price: 1200 },
  { name: 'Amlodipine 5mg', stock: 180, unit: 'tablet', price: 3000 },
  { name: 'Salep Kulit 88', stock: 40, unit: 'unit', price: 15000 },
  { name: 'Alkohol 70%', stock: 60, unit: 'botol', price: 10000 },
  { name: 'Vitamin B Complex', stock: 400, unit: 'tablet', price: 500 },
  { name: 'Ambroxol Sirup', stock: 35, unit: 'botol', price: 14500 },
  { name: 'CTM', stock: 600, unit: 'tablet', price: 300 }
];

const insertMedicine = db.prepare(
  'INSERT OR IGNORE INTO medicines (name, stock, unit, price) VALUES (?, ?, ?, ?)'
);

medicines.forEach(med => {
  const result = insertMedicine.run(med.name, med.stock, med.unit, med.price);
  if (result.changes > 0) {
    console.log(`  ✅ ${med.name}`);
  }
});

// ========== 5. HELPER FUNCTIONS ==========
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

const createPatientWithQueue = (patientData, queueData, createdAt) => {
  // Create user account
  const no_rm = generateNoRM(createdAt);
  const userResult = insertUser.run(no_rm, defaultPassword, patientData.name, 'patient');
  const userId = userResult.lastInsertRowid;

  // Create patient
  const insertPatient = db.prepare(
    'INSERT INTO patients (user_id, no_rm, name, dob, gender, address, phone) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  const patientResult = insertPatient.run(
    userId, no_rm, patientData.name, patientData.dob, patientData.gender, 
    patientData.address, patientData.phone
  );
  const patientId = patientResult.lastInsertRowid;

  // Create queue
  const queueNumber = getNextQueueNumber(createdAt);
  const insertQueue = db.prepare(
    `INSERT INTO queue (queue_number, patient_id, is_emergency, complaint, status, diagnosis, doctor_notes, total_cost, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  
  const queueResult = insertQueue.run(
    queueNumber, patientId, queueData.is_emergency || 0, queueData.complaint,
    queueData.status, queueData.diagnosis || null, queueData.doctor_notes || null,
    queueData.total_cost || 0, createdAt.toISOString(), new Date().toISOString()
  );
  const queueId = queueResult.lastInsertRowid;

  // Add prescriptions if completed
  if (queueData.status === 'completed' && queueData.medicines) {
    const insertPrescription = db.prepare(
      'INSERT INTO prescriptions (queue_id, medicine_id, quantity) VALUES (?, ?, ?)'
    );
    queueData.medicines.forEach(medId => {
      insertPrescription.run(queueId, medId, 10);
    });

    // Add transaction
    const insertTransaction = db.prepare(
      'INSERT INTO transactions (queue_id, total_amount, payment_method, created_at) VALUES (?, ?, ?, ?)'
    );
    insertTransaction.run(queueId, queueData.total_cost || 50000, 'cash', createdAt.toISOString());
  }

  return { no_rm, queueNumber, patientId };
};

// ========== 6. SEED PATIENTS HARI INI (8 patients with varied statuses) ==========
console.log('\n🗓️  Creating TODAY\'s patients (varied statuses)...');

const today = new Date();
const todayPatients = [
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
    queue: { complaint: 'Alergi kulit gatal', status: 'pharmacy', is_emergency: 0, diagnosis: 'Alergi Makanan', doctor_notes: 'Hindari seafood', medicines: [2, 14], total_cost: 20000 }
  },
  // 1 cashier
  {
    patient: { name: 'Gita Lestari', dob: '1996-07-07', gender: 'P', address: 'Jl. Menteng No. 99, Jakarta', phone: '08111111007' },
    queue: { complaint: 'Pusing berputar', status: 'cashier', is_emergency: 0, diagnosis: 'Migrain', doctor_notes: 'Istirahat cukup', medicines: [14], total_cost: 25000 }
  },
  // 1 completed
  {
    patient: { name: 'Hadi Gunawan', dob: '1997-08-08', gender: 'L', address: 'Jl. Cikini No. 33, Jakarta', phone: '08111111008' },
    queue: { complaint: 'Batuk kering', status: 'completed', is_emergency: 0, diagnosis: 'ISPA', doctor_notes: 'Banyak minum air putih', medicines: [2, 3], total_cost: 30000 }
  }
];

todayPatients.forEach((data, index) => {
  const result = createPatientWithQueue(data.patient, data.queue, today);
  console.log(`  ✅ ${data.patient.name} → ${data.queue.status} (${result.no_rm})`);
});

// ========== 7. SEED PATIENTS BULAN INI (10 completed) ==========
console.log('\n📅 Creating THIS MONTH\'s patients (completed)...');

for (let i = 0; i < 10; i++) {
  const daysAgo = Math.floor(Math.random() * 25) + 3; // 3-28 days ago
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  
  const patient = {
    name: `Patient Bulan ${i + 1}`,
    dob: `198${i}-0${(i % 9) + 1}-15`,
    gender: i % 2 === 0 ? 'L' : 'P',
    address: `Jl. Jakarta No. ${i + 100}`,
    phone: `08222222${String(i).padStart(3, '0')}`
  };
  
  const queue = {
    complaint: ['Demam', 'Batuk', 'Flu', 'Pusing', 'Mual'][i % 5],
    status: 'completed',
    diagnosis: ['Demam Virus', 'ISPA', 'Flu Biasa', 'Migrain', 'Gastritis'][i % 5],
    doctor_notes: 'Istirahat cukup dan minum obat teratur',
    medicines: [1, 4],
    total_cost: 35000
  };
  
  const result = createPatientWithQueue(patient, queue, date);
  console.log(`  ✅ ${patient.name} → ${daysAgo} hari lalu (${result.no_rm})`);
}

// ========== 8. SEED PATIENTS TAHUN LALU (8 completed) ==========
console.log('\n🗓️  Creating LAST YEAR\'s patients (completed)...');

for (let i = 0; i < 8; i++) {
  const monthsAgo = Math.floor(Math.random() * 12) + 1; // 1-12 months ago
  const date = new Date();
  date.setMonth(date.getMonth() - monthsAgo);
  
  const patient = {
    name: `Patient Tahun ${i + 1}`,
    dob: `197${i}-0${(i % 9) + 1}-20`,
    gender: i % 2 === 0 ? 'L' : 'P',
    address: `Jl. Bandung No. ${i + 200}`,
    phone: `08333333${String(i).padStart(3, '0')}`
  };
  
  const queue = {
    complaint: ['Diabetes', 'Hipertensi', 'Asma', 'Anemia'][i % 4],
    status: 'completed',
    diagnosis: ['Diabetes Melitus', 'Hipertensi', 'Asma Bronkial', 'Anemia'][i % 4],
    doctor_notes: 'Kontrol rutin setiap bulan',
    medicines: [15, 18],
    total_cost: 45000
  };
  
  const result = createPatientWithQueue(patient, queue, date);
  console.log(`  ✅ ${patient.name} → ${monthsAgo} bulan lalu (${result.no_rm})`);
}

// ========== SUMMARY ==========
console.log('\n📊 Final Summary:');
const counts = {
  users: db.prepare('SELECT COUNT(*) as c FROM users').get().c,
  patients: db.prepare('SELECT COUNT(*) as c FROM patients').get().c,
  medicines: db.prepare('SELECT COUNT(*) as c FROM medicines').get().c,
  queueToday: db.prepare("SELECT COUNT(*) as c FROM queue WHERE DATE(created_at) = DATE('now', 'localtime')").get().c,
  queueMonth: db.prepare("SELECT COUNT(*) as c FROM queue WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now', 'localtime')").get().c,
  queueCompleted: db.prepare("SELECT COUNT(*) as c FROM queue WHERE status = 'completed'").get().c
};

console.log(`  👥 Users: ${counts.users}`);
console.log(`  🏥 Patients: ${counts.patients}`);
console.log(`  💊 Medicines: ${counts.medicines}`);
console.log(`  📋 Queue Today: ${counts.queueToday}`);
console.log(`  📅 Queue This Month: ${counts.queueMonth}`);
console.log(`  ✅ Completed: ${counts.queueCompleted}`);

console.log('\n✅ Comprehensive seeding completed!');
console.log('\n🔑 All passwords: 123\n');

db.close();
