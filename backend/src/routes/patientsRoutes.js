import express from 'express';
import {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient
} from '../controllers/patientsController.js';
import { verifyToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

router.get('/', getAllPatients);
router.get('/:id', getPatientById);
router.post('/', checkRole('admin'), createPatient);
router.put('/:id', checkRole('admin'), updatePatient);
router.delete('/:id', checkRole('admin'), deletePatient);

export default router;
