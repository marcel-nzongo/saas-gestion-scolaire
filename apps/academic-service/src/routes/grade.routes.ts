import { Router } from 'express';
import { GradeController } from '../controllers/grade.controller';
import { authenticate } from '../middlewares/authenticate';

const router = Router();

router.use(authenticate);

router.get('/', GradeController.getAll);
router.post('/', GradeController.create);
router.put('/:id', GradeController.update);
router.delete('/:id', GradeController.delete);

// Moyenne d'un élève
router.get('/student/:studentId/average', GradeController.getStudentAverage);

// Bulletins d'une classe
router.get('/class/:classId/report-cards', GradeController.getClassReportCards);

// Générer le bulletin d'un élève
router.post(
  '/student/:studentId/report-card',
  GradeController.generateReportCard,
);

// Publier les notes d'un trimestre
router.post('/publish', GradeController.publishTerm);

export default router;
