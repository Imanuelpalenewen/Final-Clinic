import express from 'express';
import {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  getPatientHistory,
  searchPatients,
  getMyProfile,
  getMyQueue,
  getMyHistory,
  getMyPrescriptions
} from '../controllers/patientsController.js';
import { verifyToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Patient-specific endpoints (must be before /:id routes)
router.get('/me', checkRole('patient'), getMyProfile);
router.get('/me/queue', checkRole('patient'), getMyQueue);
router.get('/me/history', checkRole('patient'), getMyHistory);
router.get('/me/prescriptions', checkRole('patient'), getMyPrescriptions);

// Search patients (must be before /:id route)
router.get('/search', checkRole('admin', 'doctor'), searchPatients);

// Patient history
router.get('/:id/history', checkRole('admin', 'doctor', 'patient'), getPatientHistory);

// CRUD operations
router.get('/', checkRole('admin', 'doctor'), getAllPatients);
router.get('/:id', getPatientById);
router.post('/', checkRole('admin'), createPatient);
router.put('/:id', checkRole('admin'), updatePatient);

export default router;
