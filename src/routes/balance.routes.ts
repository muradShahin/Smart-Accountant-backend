import { Router } from 'express';
import { getCompanyBalance, updateCompanyBalance } from '../controllers/balance.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getCompanyBalance);
router.post('/', updateCompanyBalance);

export default router;