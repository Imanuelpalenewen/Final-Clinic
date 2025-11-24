import db from '../models/db.js';

// Create payment transaction
export const createTransaction = (req, res) => {
  try {
    const { queue_id, amount, payment_method } = req.body;

    if (!queue_id || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Queue ID dan amount harus diisi'
      });
    }

    const validMethods = ['cash', 'debit', 'credit'];
    if (payment_method && !validMethods.includes(payment_method)) {
      return res.status(400).json({
        success: false,
        message: 'Metode pembayaran tidak valid'
      });
    }

    // Check if queue exists
    const queue = db.prepare('SELECT * FROM queue WHERE id = ?').get(queue_id);
    if (!queue) {
      return res.status(404).json({
        success: false,
        message: 'Antrian tidak ditemukan'
      });
    }

    // Check if already paid
    const existingTransaction = db.prepare(
      'SELECT id FROM transactions WHERE queue_id = ?'
    ).get(queue_id);

    if (existingTransaction) {
      return res.status(400).json({
        success: false,
        message: 'Antrian ini sudah dibayar'
      });
    }

    // Create transaction
    const processPayment = db.transaction(() => {
      // Insert transaction
      const insertStmt = db.prepare(
        'INSERT INTO transactions (queue_id, amount, payment_method) VALUES (?, ?, ?)'
      );
      const result = insertStmt.run(queue_id, amount, payment_method || 'cash');

      // Update queue status to completed
      const updateQueue = db.prepare(
        "UPDATE queue SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      );
      updateQueue.run(queue_id);

      return result.lastInsertRowid;
    });

    const transactionId = processPayment();

    const transaction = db.prepare(`
      SELECT t.*, q.queue_number, p.name as patient_name, p.no_rm
      FROM transactions t
      JOIN queue q ON t.queue_id = q.id
      JOIN patients p ON q.patient_id = p.id
      WHERE t.id = ?
    `).get(transactionId);

    res.status(201).json({
      success: true,
      message: 'Pembayaran berhasil',
      data: transaction
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memproses pembayaran',
      error: error.message
    });
  }
};

// Get all transactions
export const getAllTransactions = (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = `
      SELECT t.*, q.queue_number, q.diagnosis, p.name as patient_name, p.no_rm
      FROM transactions t
      JOIN queue q ON t.queue_id = q.id
      JOIN patients p ON q.patient_id = p.id
    `;

    const params = [];

    if (startDate && endDate) {
      query += ` WHERE DATE(t.created_at) BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    } else if (startDate) {
      query += ` WHERE DATE(t.created_at) >= ?`;
      params.push(startDate);
    } else if (endDate) {
      query += ` WHERE DATE(t.created_at) <= ?`;
      params.push(endDate);
    }

    query += ` ORDER BY t.created_at DESC`;

    const transactions = params.length > 0
      ? db.prepare(query).all(...params)
      : db.prepare(query).all();

    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data transaksi',
      error: error.message
    });
  }
};

// Get transaction by ID
export const getTransactionById = (req, res) => {
  try {
    const { id } = req.params;

    const transaction = db.prepare(`
      SELECT t.*, q.queue_number, q.diagnosis, q.doctor_notes, q.total_cost,
             p.name as patient_name, p.no_rm, p.phone
      FROM transactions t
      JOIN queue q ON t.queue_id = q.id
      JOIN patients p ON q.patient_id = p.id
      WHERE t.id = ?
    `).get(id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaksi tidak ditemukan'
      });
    }

    // Get prescriptions
    const prescriptions = db.prepare(`
      SELECT pr.*, m.name as medicine_name, m.unit, m.price
      FROM prescriptions pr
      JOIN medicines m ON pr.medicine_id = m.id
      WHERE pr.queue_id = ?
    `).all(transaction.queue_id);

    transaction.prescriptions = prescriptions;

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data transaksi',
      error: error.message
    });
  }
};
