import { Request, Response } from 'express';
import { TimetableService } from '../services/timetable.service';

const getSchema = (req: Request) => (req as any).user?.tsc || 'tenant_test';

export class TimetableController {
  static async getByClass(req: Request, res: Response) {
    try {
      const { classId } = req.params;
      const { academic_year_id } = req.query;
      if (!academic_year_id)
        return res
          .status(400)
          .json({ success: false, message: 'academic_year_id requis' });
      const data = await TimetableService.getByClass(
        getSchema(req),
        classId,
        academic_year_id as string,
      );
      res.json({ success: true, data });
    } catch (error: any) {
      console.error('Erreur timetable create:', error);
      res
        .status(error.status || 500)
        .json({ success: false, message: error.message });
    }
  }

  static async getByTeacher(req: Request, res: Response) {
    try {
      const { teacherId } = req.params;
      const { academic_year_id } = req.query;
      if (!academic_year_id)
        return res
          .status(400)
          .json({ success: false, message: 'academic_year_id requis' });
      const data = await TimetableService.getByTeacher(
        getSchema(req),
        teacherId,
        academic_year_id as string,
      );
      res.json({ success: true, data });
    } catch (error: any) {
      res
        .status(error.status || 500)
        .json({ success: false, message: error.message });
    }
  }

  static async getMyTimetable(req: Request, res: Response) {
    try {
      const { academic_year_id } = req.query;
      if (!academic_year_id)
        return res
          .status(400)
          .json({ success: false, message: 'academic_year_id requis' });
      const userId = (req as any).user?.sub;
      const role = (req as any).user?.role;
      const schema = getSchema(req);
      console.log('🔍 getMyTimetable - role:', role, 'userId:', userId);

      if (role === 'student') {
        const { getTenantDb } = await import('../config/database');
        const db = getTenantDb(schema);
        const student = await db('students').where({ user_id: userId }).first();
        if (!student)
          return res
            .status(404)
            .json({ success: false, message: 'Élève non trouvé' });
        const data = await TimetableService.getByClass(
          schema,
          student.class_id,
          academic_year_id as string,
        );
        return res.json({ success: true, data });
      }

      if (role === 'teacher') {
        const data = await TimetableService.getByTeacher(
          schema,
          userId,
          academic_year_id as string,
        );
        return res.json({ success: true, data });
      }

      res.status(403).json({ success: false, message: 'Accès refusé' });
    } catch (error: any) {
      res
        .status(error.status || 500)
        .json({ success: false, message: error.message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const data = req.body;
      console.log('📥 timetable create body:', data);
      const slot = await TimetableService.create(getSchema(req), data);
      res.status(201).json({ success: true, data: slot });
    } catch (error: any) {
      console.error('❌ timetable create error:', error);
      res
        .status(error.status || 500)
        .json({ success: false, message: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const slot = await TimetableService.update(getSchema(req), id, req.body);
      res.json({ success: true, data: slot });
    } catch (error: any) {
      res
        .status(error.status || 500)
        .json({ success: false, message: error.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await TimetableService.delete(getSchema(req), id);
      res.json({ success: true, message: 'Créneau supprimé' });
    } catch (error: any) {
      res
        .status(error.status || 500)
        .json({ success: false, message: error.message });
    }
  }
}
