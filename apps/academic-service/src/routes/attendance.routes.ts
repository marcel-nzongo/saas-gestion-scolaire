import { Router } from 'express';
import { AttendanceController } from '../controllers/attendance.controller';
import { authenticate } from '../middlewares/authenticate';

const router = Router();
router.use(authenticate);

router.get('/', AttendanceController.getAll);
router.get('/stats', AttendanceController.getStats);
router.post('/', AttendanceController.create);
router.put('/:id', AttendanceController.update);
router.delete('/:id', AttendanceController.delete);

export default router;