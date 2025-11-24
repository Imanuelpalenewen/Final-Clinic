-- Klinik Sentosa Seed Data
-- Initial data untuk testing

-- Insert default users (password di-hash nanti di initDb.js)
-- Password untuk semua user: 123
INSERT OR IGNORE INTO users (username, password, full_name, role) VALUES
('admin', '$2b$10$placeholder', 'Administrator', 'admin'),
('doctor', '$2b$10$placeholder', 'Dr. Jane Smith', 'doctor'),
('pharmacist', '$2b$10$placeholder', 'John Pharmacist', 'pharmacist'),
('owner', '$2b$10$placeholder', 'Clinic Owner', 'owner'),
('patient1', '$2b$10$placeholder', 'Patient Test', 'patient');

-- Insert sample patients (user_id 5 adalah patient1)
INSERT OR IGNORE INTO patients (user_id, no_rm, name, dob, address, phone) VALUES
(5, 'RM-20251124-001', 'Patient Test', '1990-01-15', 'Jl. Test No. 1, Jakarta', '08123456789'),
(NULL, 'RM-20251124-002', 'David Tjia', '1990-05-12', 'Jl. Raya Manado No. 123, Airmadidi', '08123456790'),
(NULL, 'RM-20251124-003', 'Kevin Wijaya', '1992-08-20', 'Jl. Piere Tendean No. 45, Manado', '08987654321'),
(NULL, 'RM-20251124-004', 'Sarah Gunawan', '1988-03-15', 'Jl. Sam Ratulangi No. 78, Tomohon', '08567891234');

-- Insert sample medicines
INSERT OR IGNORE INTO medicines (name, stock, unit, price) VALUES
('Paracetamol 500mg', 100, 'tablet', 500),
('Amoxicillin 500mg', 50, 'kapsul', 5000),
('CTM 4mg', 80, 'tablet', 1500),
('Antasida', 30, 'tablet', 2000),
('OBH Combi', 20, 'botol', 15000),
('Promag Tablet', 60, 'tablet', 7000),
('Vitamin C 1000mg', 80, 'tablet', 3000),
('Salbutamol Inhaler', 10, 'unit', 45000);

-- Insert sample queue (untuk demonstrasi) - optional, bisa kosong untuk fresh start
-- INSERT OR IGNORE INTO queue (queue_number, patient_id, is_emergency, complaint, status, diagnosis, total_cost, created_at) VALUES
-- (1, 2, 0, 'Demam 3 hari', 'completed', 'Flu ringan', 25000, datetime('now', '-1 day')),
-- (2, 3, 0, 'Batuk pilek', 'completed', 'ISPA', 30000, datetime('now', '-1 day'));
