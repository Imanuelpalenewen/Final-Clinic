import db from '../models/db.js';
import bcrypt from 'bcryptjs';

// Get all patients
export const getAllPatients = (req, res) => {
  try {
    const patients = db.prepare(
      'SELECT * FROM patients ORDER BY created_at DESC'
    ).all();

    res.json({
      success: true,
      data: patients
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data pasien',
      error: error.message
    });
  }
};

// Get patient by ID
export const getPatientById = (req, res) => {
  try {
    const { id } = req.params;
    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Pasien tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: patient
    });
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data pasien',
      error: error.message
    });
  }
};

// Helper: Generate No. RM (format: RM-YYYYMMDD-XXX)
const generateNoRM = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  // Get max number for today
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

// Helper: Get next queue number for today (daily reset)
const getNextQueueNumber = () => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const maxQueue = db.prepare(
    `SELECT COALESCE(MAX(queue_number), 0) as max_num 
     FROM queue 
     WHERE DATE(created_at) = ?`
  ).get(today);

  return (maxQueue.max_num || 0) + 1;
};

// Create new patient (AUTO ADD TO QUEUE) - Updated with business rules
export const createPatient = (req, res) => {
  try {
    const { name, dob, address, phone, complaint, is_emergency } = req.body;

    // Validation
    if (!name || !dob || !address || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Nama, tanggal lahir, alamat, dan telepon harus diisi'
      });
    }

    // Check if phone already exists (untuk existing patient)
    const existingPatient = db.prepare(
      'SELECT id, no_rm, name FROM patients WHERE phone = ?'
    ).get(phone);

    if (existingPatient) {
      // Check if patient already has active queue
      const activeQueue = db.prepare(
        `SELECT id, queue_number FROM queue 
         WHERE patient_id = ? 
         AND status NOT IN ('completed', 'cancelled')`
      ).get(existingPatient.id);

      if (activeQueue) {
        return res.status(400).json({
          success: false,
          message: `Pasien sudah memiliki antrian aktif (#${String(activeQueue.queue_number).padStart(3, '0')})`
        });
      }

      // Patient exists but no active queue - create new queue
      const nextQueueNumber = getNextQueueNumber();
      
      // Convert boolean to integer for SQLite
      const emergencyFlag = is_emergency ? 1 : 0;
      
      const insertQueue = db.prepare(
        `INSERT INTO queue (queue_number, patient_id, is_emergency, complaint, status) 
         VALUES (?, ?, ?, ?, ?)`
      );
      insertQueue.run(nextQueueNumber, existingPatient.id, emergencyFlag, complaint || null, 'waiting');

      return res.status(201).json({
        success: true,
        message: 'Pasien sudah terdaftar, berhasil masuk antrian',
        patient: existingPatient,
        queue: {
          id: db.prepare('SELECT last_insert_rowid() as id').get().id,
          queue_number: nextQueueNumber,
          status: 'waiting'
        }
      });
    }

    // New patient - create patient + user + queue in transaction
    const result = db.transaction(() => {
      // Generate No. RM
      const no_rm = generateNoRM();

      // 1. Create user account for patient (username = no_rm, password = "123")
      const hashedPassword = bcrypt.hashSync('123', 10);
      
      const insertUser = db.prepare(
        'INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)'
      );
      const userResult = insertUser.run(no_rm, hashedPassword, name, 'patient');
      const userId = userResult.lastInsertRowid;

      // 2. Insert patient with user_id
      const insertStmt = db.prepare(
        'INSERT INTO patients (user_id, no_rm, name, dob, address, phone) VALUES (?, ?, ?, ?, ?, ?)'
      );
      const insertResult = insertStmt.run(userId, no_rm, name, dob, address, phone);
      const patientId = insertResult.lastInsertRowid;

      // Get next queue number (daily reset)
      const nextQueueNumber = getNextQueueNumber();

      // Add to queue automatically
      const insertQueue = db.prepare(
        `INSERT INTO queue (queue_number, patient_id, is_emergency, complaint, status) 
         VALUES (?, ?, ?, ?, ?)`
      );
      // Convert boolean to integer for SQLite
      const emergencyFlag = is_emergency ? 1 : 0;
      insertQueue.run(nextQueueNumber, patientId, emergencyFlag, complaint || null, 'waiting');

      return { patientId, no_rm, queueNumber: nextQueueNumber };
    })();

    // Get created patient
    const newPatient = db.prepare('SELECT * FROM patients WHERE id = ?').get(result.patientId);

    res.status(201).json({
      success: true,
      message: 'Pasien berhasil didaftarkan dan masuk antrian',
      patient: newPatient,
      queue: {
        id: db.prepare('SELECT last_insert_rowid() as id').get().id,
        queue_number: result.queueNumber,
        status: 'waiting'
      }
    });
  } catch (error) {
    console.error('Create patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mendaftarkan pasien',
      error: error.message
    });
  }
};

// Update patient
export const updatePatient = (req, res) => {
  try {
    const { id } = req.params;
    const { no_rm, name, dob, address, phone } = req.body;

    // Check if patient exists
    const patient = db.prepare('SELECT id FROM patients WHERE id = ?').get(id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Pasien tidak ditemukan'
      });
    }

    // Update patient
    const updateStmt = db.prepare(
      'UPDATE patients SET no_rm = ?, name = ?, dob = ?, address = ?, phone = ? WHERE id = ?'
    );
    updateStmt.run(no_rm, name, dob, address, phone, id);

    // Get updated patient
    const updatedPatient = db.prepare('SELECT * FROM patients WHERE id = ?').get(id);

    res.json({
      success: true,
      message: 'Data pasien berhasil diperbarui',
      data: updatedPatient
    });
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui data pasien',
      error: error.message
    });
  }
};

// Get patient history (examination records)
export const getPatientHistory = (req, res) => {
  try {
    const { id } = req.params;

    // Check if patient exists
    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Pasien tidak ditemukan'
      });
    }

    // Get examination history (only completed queues)
    const history = db.prepare(`
      SELECT 
        q.id,
        q.queue_number,
        q.is_emergency,
        q.complaint,
        q.status,
        q.diagnosis,
        q.doctor_notes,
        q.total_cost,
        q.created_at,
        q.updated_at
      FROM queue q
      WHERE q.patient_id = ?
      ORDER BY q.created_at DESC
    `).all(id);

    // Get prescriptions for each queue
    const historyWithPrescriptions = history.map(record => {
      const prescriptions = db.prepare(`
        SELECT 
          p.id,
          p.quantity,
          m.name as medicine_name,
          m.unit,
          m.price
        FROM prescriptions p
        JOIN medicines m ON p.medicine_id = m.id
        WHERE p.queue_id = ?
      `).all(record.id);

      return {
        ...record,
        prescriptions
      };
    });

    res.json({
      success: true,
      data: {
        patient,
        history: historyWithPrescriptions
      }
    });
  } catch (error) {
    console.error('Get patient history error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil riwayat pasien',
      error: error.message
    });
  }
};

// Search patients
export const searchPatients = (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Query pencarian harus diisi'
      });
    }

    const patients = db.prepare(`
      SELECT * FROM patients 
      WHERE name LIKE ? OR no_rm LIKE ? OR phone LIKE ?
      ORDER BY created_at DESC
      LIMIT 10
    `).all(`%${q}%`, `%${q}%`, `%${q}%`);

    res.json({
      success: true,
      data: patients
    });
  } catch (error) {
    console.error('Search patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mencari pasien',
      error: error.message
    });
  }
};

// ===== PATIENT-SPECIFIC ENDPOINTS =====

// Get current patient profile (from token)
export const getMyProfile = (req, res) => {
  try {
    const userId = req.user.id; // from JWT token
    
    // Get patient by user_id
    const patient = db.prepare(`
      SELECT id, no_rm, name, dob, address, phone, created_at
      FROM patients
      WHERE user_id = ?
    `).get(userId);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Data pasien tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: patient
    });
  } catch (error) {
    console.error('Get my profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil profil',
      error: error.message
    });
  }
};

// Get current patient's active queue
export const getMyQueue = (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get patient
    const patient = db.prepare('SELECT id FROM patients WHERE user_id = ?').get(userId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Data pasien tidak ditemukan'
      });
    }

    // Get active queue
    const queue = db.prepare(`
      SELECT 
        id, queue_number, status, is_emergency, complaint,
        diagnosis, doctor_notes, total_cost, created_at
      FROM queue
      WHERE patient_id = ? AND status NOT IN ('completed', 'cancelled')
      ORDER BY created_at DESC
      LIMIT 1
    `).get(patient.id);

    res.json({
      success: true,
      data: queue || null
    });
  } catch (error) {
    console.error('Get my queue error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil antrian',
      error: error.message
    });
  }
};

// Get current patient's medical history
export const getMyHistory = (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get patient
    const patient = db.prepare('SELECT id FROM patients WHERE user_id = ?').get(userId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Data pasien tidak ditemukan'
      });
    }

    // Get completed visits
    const history = db.prepare(`
      SELECT 
        q.id, q.queue_number, q.created_at, q.diagnosis, q.doctor_notes, q.total_cost
      FROM queue q
      WHERE q.patient_id = ? AND q.status = 'completed'
      ORDER BY q.created_at DESC
    `).all(patient.id);

    // Get prescriptions for each visit
    history.forEach(visit => {
      const prescriptions = db.prepare(`
        SELECT 
          pr.quantity,
          m.name as medicine_name,
          m.unit,
          m.price
        FROM prescriptions pr
        JOIN medicines m ON pr.medicine_id = m.id
        WHERE pr.queue_id = ?
      `).all(visit.id);
      
      visit.prescriptions = prescriptions;
    });

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Get my history error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil riwayat',
      error: error.message
    });
  }
};

// Get current patient's prescriptions
export const getMyPrescriptions = (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get patient
    const patient = db.prepare('SELECT id FROM patients WHERE user_id = ?').get(userId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Data pasien tidak ditemukan'
      });
    }

    // Get all prescriptions from completed visits
    const prescriptions = db.prepare(`
      SELECT 
        q.queue_number,
        q.created_at,
        q.diagnosis,
        pr.quantity,
        m.name as medicine_name,
        m.unit,
        m.price
      FROM prescriptions pr
      JOIN medicines m ON pr.medicine_id = m.id
      JOIN queue q ON pr.queue_id = q.id
      WHERE q.patient_id = ? AND q.status = 'completed'
      ORDER BY q.created_at DESC
    `).all(patient.id);

    res.json({
      success: true,
      data: prescriptions
    });
  } catch (error) {
    console.error('Get my prescriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil resep',
      error: error.message
    });
  }
};
