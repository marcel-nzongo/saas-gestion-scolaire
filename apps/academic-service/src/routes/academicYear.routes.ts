import { Router } from 'express';
import { AcademicYearController } from '../controllers/academicYear.controller';
import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import { createAcademicYearSchema } from '../validators/academic.validator';

const router = Router();

router.use(authenticate);

router.get('/', AcademicYearController.getAll);
router.get('/current', AcademicYearController.getCurrent);
router.post(
  '/',
  validate(createAcademicYearSchema),
  AcademicYearController.create,
);

export default router;
