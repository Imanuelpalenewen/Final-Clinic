import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '../../../database/klinik_sentosa.db');
const SCHEMA_PATH = path.join(__dirname, '../../../database/schema.sql');

console.log('🔧 Initializing Klinik Sentosa Database...\n');

// Create database connection
const db = new Database(DB_PATH, { verbose: console.log });

// Disable foreign keys untuk DROP
db.pragma('foreign_keys = OFF');

// Drop all tables untuk fresh start
console.log('🗑️  Dropping existing tables...');
db.exec('DROP TABLE IF EXISTS transactions');
db.exec('DROP TABLE IF EXISTS prescriptions');
db.exec('DROP TABLE IF EXISTS medicines');
db.exec('DROP TABLE IF EXISTS queue');
db.exec('DROP TABLE IF EXISTS patients');
db.exec('DROP TABLE IF EXISTS users');
console.log('✅ Tables dropped\n');

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Read and execute schema
console.log('📝 Creating tables from schema...');
const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
db.exec(schema);
console.log('✅ Tables created successfully\n');

// Hash password
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

// Seed data
const seedDatabase = async () => {
  console.log('🌱 Seeding database with initial data...\n');

  // Default password untuk semua user (sesuai requirement: 123)
  const defaultPassword = await hashPassword('123');

  // Insert default users
  const insertUser = db.prepare(
    'INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)'
  );

  const defaultUsers = [
    { username: 'admin', full_name: 'Administrator', role: 'admin' },
    { username: 'doctor', full_name: 'Dr. Jane Smith', role: 'doctor' },
    { username: 'pharmacist', full_name: 'John Pharmacist', role: 'pharmacist' },
    { username: 'owner', full_name: 'Clinic Owner', role: 'owner' },
    { username: 'patient1', full_name: 'Patient Test', role: 'patient' },
  ];

  defaultUsers.forEach(user => {
    insertUser.run(user.username, defaultPassword, user.full_name, user.role);
    console.log(`✅ User created: ${user.username} (password: 123)`);
  });

  // Insert sample patients (user_id 5 adalah patient1)
  const insertPatient = db.prepare(
    'INSERT OR IGNORE INTO patients (user_id, no_rm, name, dob, address, phone) VALUES (?, ?, ?, ?, ?, ?)'
  );

  const samplePatients = [
    { user_id: 5, no_rm: 'RM-20251124-001', name: 'Patient Test', dob: '1990-01-15', address: 'Jl. Test No. 1, Jakarta', phone: '08123456789' },
    { user_id: null, no_rm: 'RM-20251124-002', name: 'David Tjia', dob: '1990-05-12', address: 'Jl. Raya Manado No. 123, Airmadidi', phone: '08123456790' },
    { user_id: null, no_rm: 'RM-20251124-003', name: 'Kevin Wijaya', dob: '1992-08-20', address: 'Jl. Piere Tendean No. 45, Manado', phone: '08987654321' },
    { user_id: null, no_rm: 'RM-20251124-004', name: 'Sarah Gunawan', dob: '1988-03-15', address: 'Jl. Sam Ratulangi No. 78, Tomohon', phone: '08567891234' },
  ];

  samplePatients.forEach(patient => {
    insertPatient.run(patient.user_id, patient.no_rm, patient.name, patient.dob, patient.address, patient.phone);
  });
  console.log(`✅ ${samplePatients.length} sample patients inserted\n`);

  // Insert sample medicines
  const insertMedicine = db.prepare(
    'INSERT OR IGNORE INTO medicines (name, stock, unit, price) VALUES (?, ?, ?, ?)'
  );

  const sampleMedicines = [
    { name: 'Paracetamol 500mg', stock: 100, unit: 'tablet', price: 500 },
    { name: 'Amoxicillin 500mg', stock: 50, unit: 'kapsul', price: 5000 },
    { name: 'CTM 4mg', stock: 80, unit: 'tablet', price: 1500 },
    { name: 'Antasida', stock: 30, unit: 'tablet', price: 2000 },
    { name: 'OBH Combi', stock: 20, unit: 'botol', price: 15000 },
    { name: 'Promag Tablet', stock: 60, unit: 'tablet', price: 7000 },
    { name: 'Vitamin C 1000mg', stock: 80, unit: 'tablet', price: 3000 },
    { name: 'Salbutamol Inhaler', stock: 10, unit: 'unit', price: 45000 },
  ];

  sampleMedicines.forEach(medicine => {
    insertMedicine.run(medicine.name, medicine.stock, medicine.unit, medicine.price);
  });
  console.log(`✅ ${sampleMedicines.length} medicines inserted\n`);

  console.log('🎉 Database initialized successfully!\n');
  console.log('📌 Default credentials:');
  console.log('   Admin      : admin / 123');
  console.log('   Doctor     : doctor / 123');
  console.log('   Pharmacist : pharmacist / 123');
  console.log('   Owner      : owner / 123');
  console.log('   Patient    : patient1 / 123 (No. RM: RM-20251124-001)\n');
};

// Run seeding
seedDatabase()
  .then(() => {
    db.close();
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error initializing database:', err);
    db.close();
    process.exit(1);
  });
