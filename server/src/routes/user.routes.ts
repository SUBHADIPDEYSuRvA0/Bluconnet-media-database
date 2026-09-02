import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  changeEmployeePassword,
  toggleEmployeeStatus,
  deleteEmployee,
} from '../controllers/user.controller';

const router = Router();

router.get('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), getEmployees);
router.post('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), createEmployee);
router.patch('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), updateEmployee);
router.patch('/:id/password', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), changeEmployeePassword);
router.patch('/:id/status', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), toggleEmployeeStatus);
router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), deleteEmployee);

export default router;
