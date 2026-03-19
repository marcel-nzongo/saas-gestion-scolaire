import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller';
import { authenticate } from '../middlewares/authenticate';

const router = Router();
router.use(authenticate);

router.get('/', SettingsController.getAll);
router.get('/flat', SettingsController.getFlat);
router.put('/', SettingsController.updateMany);

export default router;
