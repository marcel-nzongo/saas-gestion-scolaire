import { Router } from 'express';

const router = Router();

import studentRoutes from './student.routes';
import classRoutes from './class.routes';
import academicYearRoutes from './academicYear.routes';
import gradeRoutes from './grade.routes';
import subjectRoutes from './subject.routes';

router.use('/students', studentRoutes);
router.use('/classes', classRoutes);
router.use('/academic-years', academicYearRoutes);
router.use('/grades', gradeRoutes);
router.use('/subjects', subjectRoutes);

export default router;
