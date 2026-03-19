import { Request, Response } from 'express';
import { DisciplineService } from '../services/discipline.service';

const getSchema = (req: Request) => (req as any).user?.tsc || 'tenant_test';

export class DisciplineController {

  static async getAll(req: Request, res: Response) {
    try {
      const { academic_year_id, student_id, type, resolved, class_id } = req.query;
      if (!academic_year_id) return res.status(400).json({ success: false, message: 'academic_year_id requis' });
      const data = await DisciplineService.getAll(getSchema(req), academic_year_id as string, {
        student_id: student_id as string,
        type: type as string,
        resolved: resolved !== undefined ? resolved === 'true' : undefined,
        class_id: class_id as string,
      });
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(error.status || 500).json({ success: false, message: error.message });
    }
  }

  static async getStats(req: Request, res: Response) {
    try {
      const { academic_year_id } = req.query;
      if (!academic_year_id) return res.status(400).json({ success: false, message: 'academic_year_id requis' });
      const data = await DisciplineService.getStats(getSchema(req), academic_year_id as string);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(error.status || 500).json({ success: false, message: error.message });
    }
  }

  static async getByStudent(req: Request, res: Response) {
    try {
      const { studentId } = req.params;
      const { academic_year_id } = req.query;
      if (!academic_year_id) return res.status(400).json({ success: false, message: 'academic_year_id requis' });
      const data = await DisciplineService.getByStudent(getSchema(req), studentId, academic_year_id as string);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(error.status || 500).json({ success: false, message: error.message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const reported_by = (req as any).user?.sub;
      const data = await DisciplineService.create(getSchema(req), { ...req.body, reported_by });
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      res.status(error.status || 500).json({ success: false, message: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = await DisciplineService.update(getSchema(req), id, req.body);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(error.status || 500).json({ success: false, message: error.message });
    }
  }

  static async resolve(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { resolution_notes } = req.body;
      const data = await DisciplineService.resolve(getSchema(req), id, resolution_notes || '');
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(error.status || 500).json({ success: false, message: error.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await DisciplineService.delete(getSchema(req), id);
      res.json({ success: true, message: 'Sanction supprimée' });
    } catch (error: any) {
      res.status(error.status || 500).json({ success: false, message: error.message });
    }
  }
}
