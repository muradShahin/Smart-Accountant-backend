import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
    getTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction
} from '../controllers/transactions.controller';

const router = Router();

// All transaction routes require authentication
router.use(authenticateToken);

router.get('/', getTransactions);
router.post('/', createTransaction);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;