import express from 'express';
import {
  createTransaction,
  getAllTransactions,
  getTransactionById
} from '../controllers/transactionsController.js';
import { verifyToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Admin acts as cashier in this system
router.post('/', checkRole('admin'), createTransaction);
router.get('/', checkRole('admin', 'owner'), getAllTransactions);
router.get('/:id', checkRole('admin', 'owner'), getTransactionById);

export default router;
