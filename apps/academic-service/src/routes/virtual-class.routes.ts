import { Router } from 'express';
import { VirtualClassController } from '../controllers/virtual-class.controller';
import { authenticate } from '../middlewares/authenticate';

const router = Router();
router.use(authenticate);

router.get('/my', VirtualClassController.getMyClasses);          // prof
router.get('/student', VirtualClassController.getByStudent);     // élève
router.get('/', VirtualClassController.getAll);                  // admin
router.get('/:id', VirtualClassController.getById);
router.post('/', VirtualClassController.create);
router.put('/:id', VirtualClassController.update);
router.patch('/:id/status', VirtualClassController.updateStatus);
router.delete('/:id', VirtualClassController.delete);
router.post('/:id/documents', VirtualClassController.addDocument);
router.delete('/:id/documents/:docId', VirtualClassController.deleteDocument);

export default router;
