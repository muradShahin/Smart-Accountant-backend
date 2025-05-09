import { Router } from 'express';
import authRoutes from './auth.routes';
import transactionRoutes from './transactions.routes';
import employeeRoutes from './employee.routes';
import balanceRoutes from './balance.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/transactions', transactionRoutes);
router.use('/employees', employeeRoutes);
router.use('/balance', balanceRoutes);

export default router;