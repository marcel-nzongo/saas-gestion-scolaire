import { Router } from 'express';
import { TimetableController } from '../controllers/timetable.controller';
import { authenticate } from '../middlewares/authenticate';

const router = Router();
router.use(authenticate);

router.get('/my', TimetableController.getMyTimetable);
router.get('/class/:classId', TimetableController.getByClass);
router.get('/teacher/:teacherId', TimetableController.getByTeacher);
router.post('/', TimetableController.create);
router.put('/:id', TimetableController.update);
router.delete('/:id', TimetableController.delete);

export default router;
