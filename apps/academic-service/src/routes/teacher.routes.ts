import { Router } from 'express';
import { TeacherController } from '../controllers/teacher.controller';
import { authenticate } from '../middlewares/authenticate';

const router = Router();

router.use(authenticate);

router.get('/', TeacherController.getAll);
router.get('/me', TeacherController.getMe);
router.get('/:id', TeacherController.getById);
router.post('/', TeacherController.create);
router.put('/:id', TeacherController.update);
router.delete('/:id', TeacherController.delete);
router.post('/:id/assignments', TeacherController.assignClass);
router.delete(
  '/:id/assignments/:assignmentId',
  TeacherController.removeAssignment,
);

export default router;
