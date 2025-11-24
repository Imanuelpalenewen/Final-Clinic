import express from 'express';
import { getDailyReport, getMonthlyReport } from '../controllers/reportsController.js';
import { verifyToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication and owner role
router.use(verifyToken);
router.use(checkRole('owner'));

router.get('/daily', getDailyReport);
router.get('/monthly', getMonthlyReport);

export default router;
