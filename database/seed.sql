-- Klinik Sentosa Seed Data
-- Initial data untuk testing

-- Insert default users (password di-hash nanti di initDb.js)
-- Password untuk semua user: password123
INSERT OR IGNORE INTO users (username, password, full_name, role) VALUES
('admin', '$2b$10$XQ8ZQJ5Y3K7X9Z9Z9Z9Z9uJ7X9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9', 'Administrator', 'admin'),
('doctor', '$2b$10$XQ8ZQJ5Y3K7X9Z9Z9Z9Z9uJ7X9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9', 'Dr. John Doe', 'doctor'),
('pharmacist', '$2b$10$XQ8ZQJ5Y3K7X9Z9Z9Z9Z9uJ7X9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9', 'Pharmacist Jane', 'pharmacist'),
('cashier', '$2b$10$XQ8ZQJ5Y3K7X9Z9Z9Z9Z9uJ7X9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9', 'Kasir Budi', 'cashier'),
('owner', '$2b$10$XQ8ZQJ5Y3K7X9Z9Z9Z9Z9uJ7X9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9', 'Owner Clinic', 'owner');

-- Insert sample patients
INSERT OR IGNORE INTO patients (no_rm, name, dob, address, phone) VALUES
('RM-001', 'David Tjia', '1990-05-12', 'Jl. Raya Manado No. 123, Airmadidi', '08123456789'),
('RM-002', 'Kevin Wijaya', '1992-08-20', 'Jl. Piere Tendean No. 45, Manado', '08987654321'),
('RM-003', 'Sarah Gunawan', '1988-03-15', 'Jl. Sam Ratulangi No. 78, Tomohon', '08567891234'),
('RM-004', 'Michael Tandy', '1995-11-30', 'Jl. Boulevard No. 56, Bitung', '08234567890');

-- Insert sample medicines
INSERT OR IGNORE INTO medicines (name, stock, unit, price) VALUES
('Paracetamol 500mg', 100, 'Tablet', 5000),
('Amoxicillin 500mg', 50, 'Tablet', 12000),
('Vitamin C 1000mg', 80, 'Tablet', 3000),
('OBH Sirup', 20, 'Botol', 25000),
('Antangin Sirup', 15, 'Sachet', 5000),
('Promag Tablet', 60, 'Tablet', 7000),
('Bodrex Flu & Batuk', 40, 'Tablet', 4000),
('Salbutamol Inhaler', 10, 'Unit', 45000);

-- Insert sample queue (untuk demonstrasi)
INSERT OR IGNORE INTO queue (queue_number, patient_id, status, created_at) VALUES
(1, 1, 'completed', datetime('now', '-1 day')),
(2, 2, 'completed', datetime('now', '-1 day')),
(3, 3, 'waiting', datetime('now'));
