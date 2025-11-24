import express from 'express';
import {
  getAllQueue,
  getQueueById,
  updateQueueStatus,
  doctorSubmitExamination,
  pharmacySubmitPrescription
} from '../controllers/queueController.js';
import { verifyToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

router.get('/', getAllQueue);
router.get('/:id', getQueueById);
router.put('/:id/status', checkRole('admin'), updateQueueStatus);
router.put('/:id/doctor', checkRole('doctor'), doctorSubmitExamination);
router.put('/:id/pharmacy', checkRole('pharmacist'), pharmacySubmitPrescription);

export default router;
