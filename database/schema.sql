-- Klinik Sentosa Database Schema
-- SQLite Database

-- Table: users (User accounts untuk login)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK(role IN ('admin', 'doctor', 'pharmacist', 'cashier', 'owner')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table: patients (Data pasien)
CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    no_rm VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    dob DATE NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table: queue (Antrian pasien)
CREATE TABLE IF NOT EXISTS queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    queue_number INTEGER NOT NULL,
    patient_id INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'waiting' CHECK(status IN ('waiting', 'doctor', 'pharmacy', 'cashier', 'completed', 'cancelled')),
    doctor_notes TEXT,
    diagnosis TEXT,
    total_cost DECIMAL(10,2) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- Table: medicines (Stok obat)
CREATE TABLE IF NOT EXISTS medicines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    stock INTEGER DEFAULT 0,
    unit VARCHAR(20),
    price DECIMAL(10,2) NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table: prescriptions (Resep obat dari dokter)
CREATE TABLE IF NOT EXISTS prescriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    queue_id INTEGER NOT NULL,
    medicine_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    FOREIGN KEY (queue_id) REFERENCES queue(id) ON DELETE CASCADE,
    FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE
);

-- Table: transactions (Pembayaran di kasir)
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    queue_id INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20) DEFAULT 'cash' CHECK(payment_method IN ('cash', 'debit', 'credit')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (queue_id) REFERENCES queue(id) ON DELETE CASCADE
);

-- Indexes untuk performa
CREATE INDEX IF NOT EXISTS idx_queue_status ON queue(status);
CREATE INDEX IF NOT EXISTS idx_queue_patient ON queue(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_queue ON prescriptions(queue_id);
CREATE INDEX IF NOT EXISTS idx_transactions_queue ON transactions(queue_id);
