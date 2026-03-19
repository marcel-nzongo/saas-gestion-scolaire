import { Router } from 'express';
import { BulletinController } from '../controllers/bulletin.controller';
import { authenticate } from '../middlewares/authenticate';

const router = Router();
router.use(authenticate);

router.get('/:studentId/pdf', BulletinController.generatePDF);
router.get('/:studentId/annual-pdf', BulletinController.generateAnnualPDF);
router.get('/:studentId/data', BulletinController.getBulletinData);
router.get('/:studentId/data-annual', BulletinController.getAnnualData);
router.get('/:studentId/ranking', BulletinController.getRanking);

export default router;
