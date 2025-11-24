import express from 'express';
import {
  getAllQueue,
  getQueueById,
  updateQueueStatus,
  doctorSubmitExamination,
  pharmacySubmitPrescription,
  cancelQueue,
  editPrescription
} from '../controllers/queueController.js';
import { verifyToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

router.get('/', getAllQueue);
router.get('/:id', getQueueById);
router.put('/:id/status', checkRole('admin'), updateQueueStatus);
router.put('/:id/examine', checkRole('doctor'), doctorSubmitExamination);
router.put('/:id/prescription/edit', checkRole('doctor'), editPrescription);
router.put('/:id/process', checkRole('pharmacist'), pharmacySubmitPrescription);
router.put('/:id/cancel', checkRole('admin'), cancelQueue);

export default router;
