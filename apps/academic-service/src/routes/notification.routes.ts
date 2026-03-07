import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticate } from '../middlewares/authenticate';

const router = Router();
router.use(authenticate);

router.post('/send', NotificationController.sendCustom);
router.post('/test-email', NotificationController.testEmail);
router.post('/test-sms', NotificationController.testSMS);

export default router;