import { Request, Response } from 'express';
import { TeacherService } from '../services/teacher.service';

const getSchema = (req: Request) => (req as any).user?.tsc || 'tenant_test';

export class TeacherController {
  static async getAll(req: Request, res: Response) {
    try {
      const schema = getSchema(req);
      const { search, is_active, page, limit } = req.query;
      const result = await TeacherService.getAll(schema, {
        search: search as string,
        is_active:
          is_active === 'true'
            ? true
            : is_active === 'false'
              ? false
              : undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(error.status || 500).json({ success: false, error });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const schema = getSchema(req);
      const teacher = await TeacherService.getById(schema, req.params.id);
      res.json({ success: true, data: teacher });
    } catch (error: any) {
      res.status(error.status || 500).json({ success: false, error });
    }
  }

  static async getMe(req: Request, res: Response) {
    try {
      const schema = getSchema(req);
      const userId = (req as any).user?.sub;
      const teacher = await TeacherService.getByUserId(schema, userId);
      res.json({ success: true, data: teacher });
    } catch (error: any) {
      res.status(error.status || 500).json({ success: false, error });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const schema = getSchema(req);
      const teacher = await TeacherService.create(schema, req.body);
      res.status(201).json({ success: true, data: teacher });
    } catch (error: any) {
      res.status(error.status || 500).json({ success: false, error });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const schema = getSchema(req);
      const teacher = await TeacherService.update(
        schema,
        req.params.id,
        req.body,
      );
      res.json({ success: true, data: teacher });
    } catch (error: any) {
      res.status(error.status || 500).json({ success: false, error });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const schema = getSchema(req);
      await TeacherService.delete(schema, req.params.id);
      res.json({ success: true, message: 'Enseignant supprimé' });
    } catch (error: any) {
      res.status(error.status || 500).json({ success: false, error });
    }
  }

  static async assignClass(req: Request, res: Response) {
    try {
      const schema = getSchema(req);
      const assignment = await TeacherService.assignClass(schema, {
        teacher_id: req.params.id,
        ...req.body,
      });
      res.status(201).json({ success: true, data: assignment });
    } catch (error: any) {
      res.status(error.status || 500).json({ success: false, error });
    }
  }

  static async removeAssignment(req: Request, res: Response) {
    try {
      const schema = getSchema(req);
      await TeacherService.removeAssignment(schema, req.params.assignmentId);
      res.json({ success: true, message: 'Assignation supprimée' });
    } catch (error: any) {
      res.status(error.status || 500).json({ success: false, error });
    }
  }
}
