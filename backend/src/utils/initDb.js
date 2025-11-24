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

  // Default password untuk semua user
  const defaultPassword = await hashPassword('password123');

  // Insert default users
  const insertUser = db.prepare(
    'INSERT OR IGNORE INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)'
  );

  const defaultUsers = [
    { username: 'admin', full_name: 'Administrator', role: 'admin' },
    { username: 'doctor', full_name: 'Dr. John Doe', role: 'doctor' },
    { username: 'pharmacist', full_name: 'Pharmacist Jane', role: 'pharmacist' },
    { username: 'cashier', full_name: 'Kasir Budi', role: 'cashier' },
    { username: 'owner', full_name: 'Owner Clinic', role: 'owner' },
  ];

  defaultUsers.forEach(user => {
    insertUser.run(user.username, defaultPassword, user.full_name, user.role);
    console.log(`✅ User created: ${user.username} (password: password123)`);
  });

  // Insert sample patients
  const insertPatient = db.prepare(
    'INSERT OR IGNORE INTO patients (no_rm, name, dob, address, phone) VALUES (?, ?, ?, ?, ?)'
  );

  const samplePatients = [
    { no_rm: 'RM-001', name: 'David Tjia', dob: '1990-05-12', address: 'Jl. Raya Manado No. 123, Airmadidi', phone: '08123456789' },
    { no_rm: 'RM-002', name: 'Kevin Wijaya', dob: '1992-08-20', address: 'Jl. Piere Tendean No. 45, Manado', phone: '08987654321' },
    { no_rm: 'RM-003', name: 'Sarah Gunawan', dob: '1988-03-15', address: 'Jl. Sam Ratulangi No. 78, Tomohon', phone: '08567891234' },
    { no_rm: 'RM-004', name: 'Michael Tandy', dob: '1995-11-30', address: 'Jl. Boulevard No. 56, Bitung', phone: '08234567890' },
  ];

  samplePatients.forEach(patient => {
    insertPatient.run(patient.no_rm, patient.name, patient.dob, patient.address, patient.phone);
  });
  console.log(`✅ ${samplePatients.length} sample patients inserted\n`);

  // Insert sample medicines
  const insertMedicine = db.prepare(
    'INSERT OR IGNORE INTO medicines (name, stock, unit, price) VALUES (?, ?, ?, ?)'
  );

  const sampleMedicines = [
    { name: 'Paracetamol 500mg', stock: 100, unit: 'Tablet', price: 5000 },
    { name: 'Amoxicillin 500mg', stock: 50, unit: 'Tablet', price: 12000 },
    { name: 'Vitamin C 1000mg', stock: 80, unit: 'Tablet', price: 3000 },
    { name: 'OBH Sirup', stock: 20, unit: 'Botol', price: 25000 },
    { name: 'Antangin', stock: 15, unit: 'Sachet', price: 5000 },
    { name: 'Promag Tablet', stock: 60, unit: 'Tablet', price: 7000 },
    { name: 'Bodrex Flu & Batuk', stock: 40, unit: 'Tablet', price: 4000 },
    { name: 'Salbutamol Inhaler', stock: 10, unit: 'Unit', price: 45000 },
  ];

  sampleMedicines.forEach(medicine => {
    insertMedicine.run(medicine.name, medicine.stock, medicine.unit, medicine.price);
  });
  console.log(`✅ ${sampleMedicines.length} medicines inserted\n`);

  console.log('🎉 Database initialized successfully!\n');
  console.log('📌 Default credentials:');
  console.log('   Username: admin / doctor / pharmacist / cashier / owner');
  console.log('   Password: password123\n');
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
