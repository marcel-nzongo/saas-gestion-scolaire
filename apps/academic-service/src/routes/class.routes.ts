import { Router } from 'express';
import { ClassController } from '../controllers/class.controller';
import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import { createClassSchema } from '../validators/academic.validator';

const router = Router();

router.use(authenticate);

router.get('/', ClassController.getAll);
router.get('/:id', ClassController.getById);
router.get('/:id/students', ClassController.getStudents);
router.post('/', validate(createClassSchema), ClassController.create);
router.put('/:id', ClassController.update);
router.delete('/:id', ClassController.delete);

export default router;
