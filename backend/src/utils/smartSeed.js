import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '../../../database/klinik_sentosa.db');
const SCHEMA_PATH = path.join(__dirname, '../../../database/schema.sql');

console.log('🌱 Smart Seeding - Klinik Sentosa Database...\n');

const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

// Check if tables exist, if not create them
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

// Add gender column if it doesn't exist
try {
  db.exec("ALTER TABLE patients ADD COLUMN gender VARCHAR(1) CHECK(gender IN ('L', 'P'))");
  console.log('✅ Added gender column to patients table\n');
} catch (error) {
  if (!error.message.includes('duplicate column')) {
    console.log('ℹ️  Gender column already exists or error:', error.message);
  }
}

const hashPassword = (password) => {
  return bcrypt.hashSync(password, 10);
};

const defaultPassword = hashPassword('123');

console.log('🔍 Checking existing data...\n');

// ========== 1. SEED STAFF USERS ==========
const staffUsers = [
  { username: 'admin', full_name: 'Administrator', role: 'admin' },
  { username: 'doctor', full_name: 'Dr. Jane Smith', role: 'doctor' },
  { username: 'pharmacist', full_name: 'John Pharmacist', role: 'pharmacist' },
  { username: 'owner', full_name: 'Clinic Owner', role: 'owner' }
];

console.log('👥 Seeding staff users...');
const insertUser = db.prepare(
  'INSERT OR IGNORE INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)'
);

staffUsers.forEach(user => {
  const result = insertUser.run(user.username, defaultPassword, user.full_name, user.role);
  if (result.changes > 0) {
    console.log(`  ✅ Created user: ${user.username}`);
  } else {
    console.log(`  ℹ️  User exists: ${user.username}`);
  }
});

// ========== 2. CREATE USER ACCOUNTS FOR EXISTING PATIENTS ==========
console.log('\n🔗 Creating user accounts for existing patients...');

const patientsWithoutUser = db.prepare(
  'SELECT id, no_rm, name FROM patients WHERE user_id IS NULL'
).all();

if (patientsWithoutUser.length > 0) {
  patientsWithoutUser.forEach(patient => {
    // Create user account
    const userResult = insertUser.run(patient.no_rm, defaultPassword, patient.name, 'patient');
    if (userResult.changes > 0) {
      const userId = userResult.lastInsertRowid;
      
      // Link patient to user
      db.prepare('UPDATE patients SET user_id = ? WHERE id = ?').run(userId, patient.id);
      console.log(`  ✅ Created account for ${patient.name} (${patient.no_rm})`);
    }
  });
} else {
  console.log('  ℹ️  All patients already have user accounts');
}

// ========== 3. SEED 20 MEDICINES ==========
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
    console.log(`  ✅ Added: ${med.name}`);
  }
});

// Check total medicines
const totalMedicines = db.prepare('SELECT COUNT(*) as count FROM medicines').get();
console.log(`  📊 Total medicines: ${totalMedicines.count}`);

// ========== 4. SEED 20 DUMMY PATIENTS ==========
console.log('\n👨‍👩‍👧‍👦 Seeding 20 dummy patients with complete data...');

const dummyPatients = [
  { name: 'Budi Santoso', dob: '1985-03-15', gender: 'L', address: 'Jl. Merdeka No. 10, Jakarta Pusat', phone: '081234567801', complaint: 'Demam dan batuk' },
  { name: 'Siti Aminah', dob: '1990-07-22', gender: 'P', address: 'Jl. Sudirman No. 45, Jakarta Selatan', phone: '081234567802', complaint: 'Sakit kepala' },
  { name: 'Ahmad Yani', dob: '1978-11-30', gender: 'L', address: 'Jl. Gatot Subroto No. 12, Jakarta Barat', phone: '081234567803', complaint: 'Nyeri dada' },
  { name: 'Dewi Lestari', dob: '1995-05-18', gender: 'P', address: 'Jl. Thamrin No. 88, Jakarta Pusat', phone: '081234567804', complaint: 'Flu dan pilek' },
  { name: 'Rizki Pratama', dob: '2000-09-25', gender: 'L', address: 'Jl. Kebon Jeruk No. 33, Jakarta Barat', phone: '081234567805', complaint: 'Sakit perut' },
  { name: 'Maya Putri', dob: '1988-12-10', gender: 'P', address: 'Jl. Cikini Raya No. 7, Jakarta Pusat', phone: '081234567806', complaint: 'Alergi kulit' },
  { name: 'Andi Wijaya', dob: '1982-04-08', gender: 'L', address: 'Jl. Menteng No. 21, Jakarta Pusat', phone: '081234567807', complaint: 'Batuk kering' },
  { name: 'Rina Susanti', dob: '1993-08-14', gender: 'P', address: 'Jl. Kemang No. 56, Jakarta Selatan', phone: '081234567808', complaint: 'Demam tinggi' },
  { name: 'Hadi Gunawan', dob: '1975-02-28', gender: 'L', address: 'Jl. Pejaten No. 19, Jakarta Selatan', phone: '081234567809', complaint: 'Diabetes kontrol' },
  { name: 'Lina Marlina', dob: '1998-06-05', gender: 'P', address: 'Jl. Tebet No. 42, Jakarta Selatan', phone: '081234567810', complaint: 'Mual dan muntah' },
  { name: 'Fajar Ramadhan', dob: '1987-10-12', gender: 'L', address: 'Jl. Cawang No. 15, Jakarta Timur', phone: '081234567811', complaint: 'Asma kambuh' },
  { name: 'Novi Andriani', dob: '1991-01-20', gender: 'P', address: 'Jl. Rawamangun No. 28, Jakarta Timur', phone: '081234567812', complaint: 'Migrain' },
  { name: 'Doni Setiawan', dob: '1980-07-17', gender: 'L', address: 'Jl. Duren Sawit No. 9, Jakarta Timur', phone: '081234567813', complaint: 'Hipertensi' },
  { name: 'Fitri Handayani', dob: '1996-03-23', gender: 'P', address: 'Jl. Kelapa Gading No. 67, Jakarta Utara', phone: '081234567814', complaint: 'Infeksi tenggorokan' },
  { name: 'Agus Salim', dob: '1983-11-09', gender: 'L', address: 'Jl. Sunter No. 34, Jakarta Utara', phone: '081234567815', complaint: 'Luka bakar ringan' },
  { name: 'Diah Permata', dob: '1994-09-30', gender: 'P', address: 'Jl. Pluit No. 52, Jakarta Utara', phone: '081234567816', complaint: 'Demam berdarah' },
  { name: 'Teguh Prasetyo', dob: '1977-05-25', gender: 'L', address: 'Jl. Tanah Abang No. 11, Jakarta Pusat', phone: '081234567817', complaint: 'Asam lambung' },
  { name: 'Eka Wulandari', dob: '1999-12-01', gender: 'P', address: 'Jl. Mangga Besar No. 23, Jakarta Barat', phone: '081234567818', complaint: 'ISPA' },
  { name: 'Bambang Hermawan', dob: '1986-08-19', gender: 'L', address: 'Jl. Grogol No. 44, Jakarta Barat', phone: '081234567819', complaint: 'Gigi berlubang' },
  { name: 'Sari Indah', dob: '1992-04-11', gender: 'P', address: 'Jl. Pasar Minggu No. 31, Jakarta Selatan', phone: '081234567820', complaint: 'Anemia' }
];

// Get current date for RM generation
const today = new Date();
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, '0');
const day = String(today.getDate()).padStart(2, '0');
const dateStr = `${year}${month}${day}`;

// Get max RM number for today
const maxRmResult = db.prepare(
  `SELECT no_rm FROM patients WHERE no_rm LIKE ? ORDER BY no_rm DESC LIMIT 1`
).get(`RM-${dateStr}-%`);

let currentRmNum = 1;
if (maxRmResult) {
  const lastNum = parseInt(maxRmResult.no_rm.split('-')[2]);
  currentRmNum = lastNum + 1;
}

const insertPatient = db.prepare(
  'INSERT INTO patients (user_id, no_rm, name, dob, gender, address, phone) VALUES (?, ?, ?, ?, ?, ?, ?)'
);

dummyPatients.forEach((patient, index) => {
  const no_rm = `RM-${dateStr}-${String(currentRmNum).padStart(3, '0')}`;
  
  // Check if patient already exists by phone
  const existing = db.prepare('SELECT id FROM patients WHERE phone = ?').get(patient.phone);
  
  if (!existing) {
    // Create user account first
    const userResult = insertUser.run(no_rm, defaultPassword, patient.name, 'patient');
    const userId = userResult.lastInsertRowid;
    
    // Create patient record
    const patientResult = insertPatient.run(
      userId, no_rm, patient.name, patient.dob, patient.gender, patient.address, patient.phone
    );
    const patientId = patientResult.lastInsertRowid;
    
    console.log(`  ✅ ${patient.name} (${no_rm}) - ${patient.complaint}`);
    
    // Create medical history (queue + prescription)
    createMedicalHistory(patientId, no_rm, patient.complaint, index + 1);
    
    currentRmNum++;
  }
});

// ========== 5. CREATE MEDICAL HISTORY FUNCTION ==========
function createMedicalHistory(patientId, no_rm, complaint, queueNumber) {
  // Sample diagnoses and prescriptions
  const medicalCases = [
    { diagnosis: 'Demam Virus', notes: 'Istirahat cukup, banyak minum air putih', medicines: [1, 4] }, // Paracetamol, Vitamin C
    { diagnosis: 'ISPA (Infeksi Saluran Pernapasan Atas)', notes: 'Hindari asap dan debu', medicines: [2, 3] }, // Amoxicillin, OBH Combi
    { diagnosis: 'Gastritis Akut', notes: 'Hindari makanan pedas dan asam', medicines: [7, 1] }, // Promag, Paracetamol
    { diagnosis: 'Hipertensi', notes: 'Kontrol tekanan darah rutin', medicines: [15] }, // Amlodipine
    { diagnosis: 'Alergi Kulit', notes: 'Hindari alergen, jaga kebersihan kulit', medicines: [16, 14] }, // Salep, Ibuprofen
    { diagnosis: 'Migrain', notes: 'Istirahat dalam ruangan gelap', medicines: [14, 1] }, // Ibuprofen, Paracetamol
    { diagnosis: 'Diabetes Melitus Tipe 2', notes: 'Kontrol gula darah, diet ketat', medicines: [18] }, // Vitamin B Complex
    { diagnosis: 'Anemia', notes: 'Konsumsi makanan tinggi zat besi', medicines: [8, 18] }, // Sangobion, Vitamin B
    { diagnosis: 'Asma', notes: 'Hindari pemicu asma', medicines: [19, 14] }, // Ambroxol, Ibuprofen
    { diagnosis: 'Diare Akut', notes: 'Minum oralit, hindari makanan berminyak', medicines: [6] } // Oralit
  ];
  
  const caseIndex = (queueNumber - 1) % medicalCases.length;
  const medCase = medicalCases[caseIndex];
  
  // Calculate total cost
  let totalCost = 0;
  medCase.medicines.forEach(medId => {
    const med = db.prepare('SELECT price FROM medicines WHERE id = ?').get(medId);
    if (med) totalCost += med.price * 10; // Assume 10 quantity
  });
  
  // Insert queue with completed status
  const insertQueue = db.prepare(
    `INSERT INTO queue (queue_number, patient_id, is_emergency, complaint, status, diagnosis, doctor_notes, total_cost, created_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-' || CAST(? AS TEXT) || ' days'))`
  );
  
  const daysAgo = Math.floor(Math.random() * 30); // Random date in last 30 days
  const queueResult = insertQueue.run(
    queueNumber, patientId, 0, complaint, 'completed', 
    medCase.diagnosis, medCase.notes, totalCost, daysAgo
  );
  const queueId = queueResult.lastInsertRowid;
  
  // Insert prescriptions
  const insertPrescription = db.prepare(
    'INSERT INTO prescriptions (queue_id, medicine_id, quantity) VALUES (?, ?, ?)'
  );
  
  medCase.medicines.forEach(medId => {
    insertPrescription.run(queueId, medId, 10);
  });
  
  // Insert transaction
  const insertTransaction = db.prepare(
    `INSERT INTO transactions (queue_id, total_amount, payment_method, created_at) VALUES (?, ?, ?, datetime('now', '-' || CAST(? AS TEXT) || ' days'))`
  );
  insertTransaction.run(queueId, totalCost, 'cash', daysAgo);
}

// ========== SUMMARY ==========
console.log('\n📊 Database Summary:');
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
const patientCount = db.prepare('SELECT COUNT(*) as count FROM patients').get();
const medicineCount = db.prepare('SELECT COUNT(*) as count FROM medicines').get();
const queueCount = db.prepare("SELECT COUNT(*) as count FROM queue WHERE status = 'completed'").get();

console.log(`  👥 Users: ${userCount.count}`);
console.log(`  🏥 Patients: ${patientCount.count}`);
console.log(`  💊 Medicines: ${medicineCount.count}`);
console.log(`  📋 Completed Records: ${queueCount.count}`);

console.log('\n✅ Smart seeding completed successfully!');
console.log('\n🔑 Login credentials:');
console.log('   Staff: admin / doctor / pharmacist / owner → password: 123');
console.log('   Patients: Use No. RM as username → password: 123\n');

db.close();
