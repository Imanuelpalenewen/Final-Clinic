import db from '../models/db.js';

// Get all medicines
export const getAllMedicines = (req, res) => {
  try {
    const medicines = db.prepare(
      'SELECT * FROM medicines ORDER BY name ASC'
    ).all();

    res.json({
      success: true,
      data: medicines
    });
  } catch (error) {
    console.error('Get medicines error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data obat',
      error: error.message
    });
  }
};

// Get medicine by ID
export const getMedicineById = (req, res) => {
  try {
    const { id } = req.params;
    const medicine = db.prepare('SELECT * FROM medicines WHERE id = ?').get(id);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Obat tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: medicine
    });
  } catch (error) {
    console.error('Get medicine error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data obat',
      error: error.message
    });
  }
};

// Create new medicine
export const createMedicine = (req, res) => {
  try {
    const { name, stock, unit, price } = req.body;

    if (!name || !unit || !price) {
      return res.status(400).json({
        success: false,
        message: 'Nama, satuan, dan harga harus diisi'
      });
    }

    const insertStmt = db.prepare(
      'INSERT INTO medicines (name, stock, unit, price) VALUES (?, ?, ?, ?)'
    );
    const result = insertStmt.run(name, stock || 0, unit, price);

    const newMedicine = db.prepare('SELECT * FROM medicines WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: 'Obat berhasil ditambahkan',
      data: newMedicine
    });
  } catch (error) {
    console.error('Create medicine error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menambahkan obat',
      error: error.message
    });
  }
};

// Update medicine
export const updateMedicine = (req, res) => {
  try {
    const { id } = req.params;
    const { name, stock, unit, price } = req.body;

    const medicine = db.prepare('SELECT id FROM medicines WHERE id = ?').get(id);
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Obat tidak ditemukan'
      });
    }

    const updateStmt = db.prepare(
      'UPDATE medicines SET name = ?, stock = ?, unit = ?, price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    );
    updateStmt.run(name, stock, unit, price, id);

    const updatedMedicine = db.prepare('SELECT * FROM medicines WHERE id = ?').get(id);

    res.json({
      success: true,
      message: 'Data obat berhasil diperbarui',
      data: updatedMedicine
    });
  } catch (error) {
    console.error('Update medicine error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui data obat',
      error: error.message
    });
  }
};

// Delete medicine
export const deleteMedicine = (req, res) => {
  try {
    const { id } = req.params;

    const medicine = db.prepare('SELECT id FROM medicines WHERE id = ?').get(id);
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Obat tidak ditemukan'
      });
    }

    const deleteStmt = db.prepare('DELETE FROM medicines WHERE id = ?');
    deleteStmt.run(id);

    res.json({
      success: true,
      message: 'Obat berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete medicine error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus obat',
      error: error.message
    });
  }
};
