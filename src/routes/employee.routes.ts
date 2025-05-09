import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
    getAllEmployees,
    createEmployee,
    getEmployeeTransactions,
    addEmployeeTransaction,
    recordAttendance,
    getEmployeeAttendance,
    getEmployeeCurrentBalance
} from '../controllers/employee.controller';

const router = Router();

router.use(authenticateToken);

router.get('/', getAllEmployees);
router.post('/', createEmployee);
router.get('/:id/transactions', getEmployeeTransactions);
router.post('/:id/transactions', addEmployeeTransaction);
router.get('/:id/attendance', getEmployeeAttendance);
router.post('/:id/attendance', recordAttendance);
router.get('/:id/balance', getEmployeeCurrentBalance);

export default router;