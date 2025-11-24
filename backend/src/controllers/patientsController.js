import db from '../models/db.js';

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

// Create new patient (AUTO ADD TO QUEUE)
export const createPatient = (req, res) => {
  try {
    const { no_rm, name, dob, address, phone } = req.body;

    // Validation
    if (!no_rm || !name || !dob) {
      return res.status(400).json({
        success: false,
        message: 'No RM, nama, dan tanggal lahir harus diisi'
      });
    }

    // Check if no_rm already exists
    const existingPatient = db.prepare(
      'SELECT id FROM patients WHERE no_rm = ?'
    ).get(no_rm);

    if (existingPatient) {
      return res.status(400).json({
        success: false,
        message: 'No RM sudah terdaftar'
      });
    }

    // Start transaction
    const insertPatient = db.transaction(() => {
      // Insert patient
      const insertStmt = db.prepare(
        'INSERT INTO patients (no_rm, name, dob, address, phone) VALUES (?, ?, ?, ?, ?)'
      );
      const result = insertStmt.run(no_rm, name, dob, address, phone);
      const patientId = result.lastInsertRowid;

      // Get next queue number (auto-increment)
      const maxQueue = db.prepare(
        'SELECT COALESCE(MAX(queue_number), 0) as max_num FROM queue'
      ).get();
      const nextQueueNumber = maxQueue.max_num + 1;

      // Add to queue automatically
      const insertQueue = db.prepare(
        'INSERT INTO queue (queue_number, patient_id, status) VALUES (?, ?, ?)'
      );
      insertQueue.run(nextQueueNumber, patientId, 'waiting');

      return { patientId, queueNumber: nextQueueNumber };
    });

    const { patientId, queueNumber } = insertPatient();

    // Get created patient
    const newPatient = db.prepare('SELECT * FROM patients WHERE id = ?').get(patientId);

    res.status(201).json({
      success: true,
      message: 'Pasien berhasil didaftarkan dan masuk antrian',
      data: {
        patient: newPatient,
        queueNumber
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

// Delete patient (soft delete - set queue status to cancelled)
export const deletePatient = (req, res) => {
  try {
    const { id } = req.params;

    // Check if patient exists
    const patient = db.prepare('SELECT id FROM patients WHERE id = ?').get(id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Pasien tidak ditemukan'
      });
    }

    // Soft delete: Update queue status to 'cancelled' instead of deleting
    const updateQueue = db.prepare(
      "UPDATE queue SET status = 'cancelled' WHERE patient_id = ? AND status != 'completed'"
    );
    updateQueue.run(id);

    // Delete patient (cascade will handle related records)
    const deleteStmt = db.prepare('DELETE FROM patients WHERE id = ?');
    deleteStmt.run(id);

    res.json({
      success: true,
      message: 'Pasien berhasil dihapus (nomor antrian tetap ada)'
    });
  } catch (error) {
    console.error('Delete patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus pasien',
      error: error.message
    });
  }
};
