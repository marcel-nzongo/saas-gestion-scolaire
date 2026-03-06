import { Router } from 'express';
import { ParentController } from '../controllers/parent.controller';
import { authenticate } from '../middlewares/authenticate';

const router = Router();

router.use(authenticate);

router.get('/', ParentController.getAll);
router.get('/me', ParentController.getMe);
router.get('/:id', ParentController.getById);
router.post('/', ParentController.create);
router.put('/:id', ParentController.update);
router.delete('/:id', ParentController.delete);
router.post('/:id/students', ParentController.linkStudent);
router.delete('/:id/students/:studentId', ParentController.unlinkStudent);

export default router;