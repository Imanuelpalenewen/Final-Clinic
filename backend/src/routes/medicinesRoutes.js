import express from 'express';
import {
  getAllMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine
} from '../controllers/medicinesController.js';
import { verifyToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

router.get('/', getAllMedicines);
router.get('/:id', getMedicineById);
router.post('/', checkRole('pharmacist', 'admin'), createMedicine);
router.put('/:id', checkRole('pharmacist', 'admin'), updateMedicine);
router.delete('/:id', checkRole('pharmacist', 'admin'), deleteMedicine);

export default router;
