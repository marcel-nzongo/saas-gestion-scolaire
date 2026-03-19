import { Router } from 'express';
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
import notificationRoutes from './notification.routes';
import bulletinRoutes from './bulletin.routes';
import timetableRoutes from './timetable.routes';
import disciplineRoutes from './discipline.routes';
import settingsRoutes from './settings.routes';
import virtualClassRoutes from './virtual-class.routes';



const router = Router();

router.use('/students', studentRoutes);
router.use('/classes', classRoutes);
router.use('/academic-years', academicYearRoutes);
router.use('/grades', gradeRoutes);
router.use('/subjects', subjectRoutes);
router.use('/teachers', teacherRoutes);
router.use('/resources', resourceRoutes);
router.use('/parents', parentRoutes);
router.use('/attendances', attendanceRoutes);
router.use('/finance', financeRoutes);
router.use('/notifications', notificationRoutes);
router.use('/bulletins', bulletinRoutes);
router.use('/timetable', timetableRoutes);
router.use('/discipline', disciplineRoutes);
router.use('/settings', settingsRoutes);
router.use('/virtual-classes', virtualClassRoutes);

export default router;
