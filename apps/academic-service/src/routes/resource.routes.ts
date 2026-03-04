import { Router } from 'express';
import { ResourceController } from '../controllers/resource.controller';
import { authenticate } from '../middlewares/authenticate';
import { upload } from '../config/upload';

const router = Router();

router.use(authenticate);

// Ressources
router.get('/', ResourceController.getAll);
router.post('/upload', upload.single('file'), ResourceController.upload);
router.delete('/:id', ResourceController.delete);

// Forum
router.get('/forum/topics', ResourceController.getTopics);
router.post('/forum/topics', ResourceController.createTopic);
router.delete('/forum/topics/:id', ResourceController.deleteTopic);
router.get('/forum/topics/:topicId/replies', ResourceController.getReplies);
router.post('/forum/topics/:topicId/replies', ResourceController.createReply);

export default router;