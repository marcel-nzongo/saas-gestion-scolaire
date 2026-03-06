import { Request, Response } from 'express';
import { AttendanceService } from '../services/attendance.service';

const getSchema = (req: Request) => (req as any).user?.tsc || 'tenant_test';
const getUserId = (req: Request) => (req as any).user?.sub;

export class AttendanceController {

  static async getAll(req: Request, res: Response) {
    try {
      const schema = getSchema(req);
      const { student_id, class_id, academic_year_id, type, from_date, to_date } = req.query;
      const data = await AttendanceService.getAll(schema, {
        student_id: student_id as string,
        class_id: class_id as string,
        academic_year_id: academic_year_id as string,
        type: type as string,
        from_date: from_date as string,
        to_date: to_date as string,
      });
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error });
    }
  }

  static async getStats(req: Request, res: Response) {
    try {
      const schema = getSchema(req);
      const { student_id, academic_year_id } = req.query;
      const stats = await AttendanceService.getStats(
        schema,
        student_id as string,
        academic_year_id as string,
      );
      res.json({ success: true, data: stats });
    } catch (error: any) {
      res.status(500).json({ success: false, error });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const schema = getSchema(req);
      const userId = getUserId(req);
      const attendance = await AttendanceService.create(schema, {
        ...req.body,
        created_by: userId,
      });
      res.status(201).json({ success: true, data: attendance });
    } catch (error: any) {
      res.status(500).json({ success: false, error });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const schema = getSchema(req);
      const userId = getUserId(req);
      const attendance = await AttendanceService.update(schema, req.params.id, {
        ...req.body,
        justified_by: userId,
        justified_at: req.body.is_justified ? new Date().toISOString() : undefined,
      });
      res.json({ success: true, data: attendance });
    } catch (error: any) {
      res.status(500).json({ success: false, error });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const schema = getSchema(req);
      await AttendanceService.delete(schema, req.params.id);
      res.json({ success: true, message: 'Supprimé' });
    } catch (error: any) {
      res.status(500).json({ success: false, error });
    }
  }
}