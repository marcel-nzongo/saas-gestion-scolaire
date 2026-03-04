import { Router } from 'express';
import { SubjectController } from '../controllers/subject.controller';
import { authenticate } from '../middlewares/authenticate';

const router = Router();
router.use(authenticate);
router.get('/', SubjectController.getAll);
router.post('/', SubjectController.create);
export default router;
