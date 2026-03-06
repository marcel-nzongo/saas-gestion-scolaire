import { Router } from 'express';

const router = Router();

import studentRoutes from './student.routes';
import classRoutes from './class.routes';
import academicYearRoutes from './academicYear.routes';
import gradeRoutes from './grade.routes';
import subjectRoutes from './subject.routes';
import teacherRoutes from './teacher.routes';
import resourceRoutes from './resource.routes';
import parentRoutes from './parent.routes';
import attendanceRoutes from './attendance.routes';
import financeRoutes from './finance.routes';


router.use('/students', studentRoutes);
router.use('/classes', classRoutes);
router.use('/academic-years', academicYearRoutes);
router.use('/grades', gradeRoutes);
router.use('/subjects', subjectRoutes);
router.use('/resources', resourceRoutes);
router.use('/attendances', attendanceRoutes);

// Dans la fonction setupRoutes, ajoute :
router.use('/teachers', teacherRoutes);
// Dans setupRoutes :
router.use('/parents', parentRoutes);
router.use('/finance', financeRoutes);

export default router;
