import db from '../models/db.js';

// Get all queue with filter
export const getAllQueue = (req, res) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT q.*, p.no_rm, p.name, p.dob, p.phone 
      FROM queue q 
      JOIN patients p ON q.patient_id = p.id
    `;

    if (status) {
      query += ` WHERE q.status = ?`;
    }

    query += ` ORDER BY q.queue_number ASC`;

    const queue = status 
      ? db.prepare(query).all(status)
      : db.prepare(query).all();

    res.json({
      success: true,
      data: queue
    });
  } catch (error) {
    console.error('Get queue error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data antrian',
      error: error.message
    });
  }
};

// Get queue by ID with full details
export const getQueueById = (req, res) => {
  try {
    const { id } = req.params;

    const queue = db.prepare(`
      SELECT q.*, p.no_rm, p.name, p.dob, p.phone, p.address 
      FROM queue q 
      JOIN patients p ON q.patient_id = p.id
      WHERE q.id = ?
    `).get(id);

    if (!queue) {
      return res.status(404).json({
        success: false,
        message: 'Antrian tidak ditemukan'
      });
    }

    // Get prescriptions if any
    const prescriptions = db.prepare(`
      SELECT pr.*, m.name as medicine_name, m.unit, m.price
      FROM prescriptions pr
      JOIN medicines m ON pr.medicine_id = m.id
      WHERE pr.queue_id = ?
    `).all(id);

    queue.prescriptions = prescriptions;

    res.json({
      success: true,
      data: queue
    });
  } catch (error) {
    console.error('Get queue by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data antrian',
      error: error.message
    });
  }
};

// Update queue status
export const updateQueueStatus = (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['waiting', 'doctor', 'pharmacy', 'cashier', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status tidak valid'
      });
    }

    const updateStmt = db.prepare(
      'UPDATE queue SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    );
    updateStmt.run(status, id);

    const updatedQueue = db.prepare('SELECT * FROM queue WHERE id = ?').get(id);

    res.json({
      success: true,
      message: 'Status antrian berhasil diperbarui',
      data: updatedQueue
    });
  } catch (error) {
    console.error('Update queue status error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui status antrian',
      error: error.message
    });
  }
};

// Doctor submit examination
export const doctorSubmitExamination = (req, res) => {
  try {
    const { id } = req.params;
    const { diagnosis, doctor_notes, prescriptions } = req.body;

    if (!diagnosis) {
      return res.status(400).json({
        success: false,
        message: 'Diagnosis harus diisi'
      });
    }

    // Start transaction
    const submitExam = db.transaction(() => {
      // Update queue with diagnosis and notes
      const updateQueue = db.prepare(
        "UPDATE queue SET diagnosis = ?, doctor_notes = ?, status = 'pharmacy', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      );
      updateQueue.run(diagnosis, doctor_notes, id);

      // Insert prescriptions if any
      if (prescriptions && prescriptions.length > 0) {
        const insertPrescription = db.prepare(
          'INSERT INTO prescriptions (queue_id, medicine_id, quantity) VALUES (?, ?, ?)'
        );

        prescriptions.forEach(item => {
          insertPrescription.run(id, item.medicine_id, item.quantity);
        });
      }
    });

    submitExam();

    const updatedQueue = db.prepare(`
      SELECT q.*, p.name as patient_name 
      FROM queue q 
      JOIN patients p ON q.patient_id = p.id
      WHERE q.id = ?
    `).get(id);

    res.json({
      success: true,
      message: 'Pemeriksaan berhasil disimpan',
      data: updatedQueue
    });
  } catch (error) {
    console.error('Doctor submit examination error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menyimpan pemeriksaan',
      error: error.message
    });
  }
};

// Pharmacy submit prescription (calculate total cost)
export const pharmacySubmitPrescription = (req, res) => {
  try {
    const { id } = req.params;

    // Get prescriptions for this queue
    const prescriptions = db.prepare(`
      SELECT pr.*, m.price, m.stock, m.name as medicine_name
      FROM prescriptions pr
      JOIN medicines m ON pr.medicine_id = m.id
      WHERE pr.queue_id = ?
    `).all(id);

    if (prescriptions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada resep untuk antrian ini'
      });
    }

    // Check stock availability
    for (const item of prescriptions) {
      if (item.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Stok obat ${item.medicine_name} tidak mencukupi (tersedia: ${item.stock}, diminta: ${item.quantity})`
        });
      }
    }

    // Calculate total cost and update stock
    const processPharmacy = db.transaction(() => {
      let totalCost = 0;

      prescriptions.forEach(item => {
        totalCost += item.price * item.quantity;

        // Update medicine stock
        const updateStock = db.prepare(
          'UPDATE medicines SET stock = stock - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        );
        updateStock.run(item.quantity, item.medicine_id);
      });

      // Update queue with total cost and change status to cashier
      const updateQueue = db.prepare(
        "UPDATE queue SET total_cost = ?, status = 'cashier', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      );
      updateQueue.run(totalCost, id);

      return totalCost;
    });

    const totalCost = processPharmacy();

    const updatedQueue = db.prepare('SELECT * FROM queue WHERE id = ?').get(id);

    res.json({
      success: true,
      message: 'Resep berhasil diproses',
      data: {
        queue: updatedQueue,
        total_cost: totalCost
      }
    });
  } catch (error) {
    console.error('Pharmacy submit error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memproses resep',
      error: error.message
    });
  }
};
