import { Router } from 'express';
import { DisciplineController } from '../controllers/discipline.controller';
import { authenticate } from '../middlewares/authenticate';

const router = Router();
router.use(authenticate);

router.get('/stats', DisciplineController.getStats);
router.get('/', DisciplineController.getAll);
router.get('/student/:studentId', DisciplineController.getByStudent);
router.post('/', DisciplineController.create);
router.put('/:id', DisciplineController.update);
router.patch('/:id/resolve', DisciplineController.resolve);
router.delete('/:id', DisciplineController.delete);

export default router;
