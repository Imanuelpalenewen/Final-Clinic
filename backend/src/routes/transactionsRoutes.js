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

router.post('/', checkRole('cashier'), createTransaction);
router.get('/', getAllTransactions);
router.get('/:id', getTransactionById);

export default router;
