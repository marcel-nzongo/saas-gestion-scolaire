import { Router } from 'express';
import { StudentController } from '../controllers/student.controller';
import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import {
  createStudentSchema,
  updateStudentSchema,
} from '../validators/academic.validator';

const router = Router();

router.use(authenticate);

router.get('/', StudentController.getAll);
router.get('/:id', StudentController.getById);
router.post('/', validate(createStudentSchema), StudentController.create);
router.put('/:id', validate(updateStudentSchema), StudentController.update);
router.delete('/:id', StudentController.delete);

export default router;
