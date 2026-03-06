import { Request, Response } from 'express';
import { ParentService } from '../services/parent.service';

const getSchema = (req: Request) => (req as any).user?.tsc || 'tenant_test';
const getUserId = (req: Request) => (req as any).user?.sub;

export class ParentController {

  static async getAll(req: Request, res: Response) {
    try {
      const schema = getSchema(req);
      const { search, page, limit } = req.query;
      const result = await ParentService.getAll(schema, {
        search: search as string,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, error });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const schema = getSchema(req);
      const parent = await ParentService.getById(schema, req.params.id);
      res.json({ success: true, data: parent });
    } catch (error: any) {
      res.status(error.status || 500).json({ success: false, error });
    }
  }

  static async getMe(req: Request, res: Response) {
    try {
      const schema = getSchema(req);
      const userId = getUserId(req);
      const parent = await ParentService.getByUserId(schema, userId);
      res.json({ success: true, data: parent });
    } catch (error: any) {
      res.status(error.status || 500).json({ success: false, error });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const schema = getSchema(req);
      const parent = await ParentService.create(schema, req.body);
      res.status(201).json({ success: true, data: parent });
    } catch (error: any) {
      res.status(error.status || 500).json({ success: false, error });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const schema = getSchema(req);
      const parent = await ParentService.update(schema, req.params.id, req.body);
      res.json({ success: true, data: parent });
    } catch (error: any) {
      res.status(error.status || 500).json({ success: false, error });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const schema = getSchema(req);
      await ParentService.delete(schema, req.params.id);
      res.json({ success: true, message: 'Parent supprimé' });
    } catch (error: any) {
      res.status(error.status || 500).json({ success: false, error });
    }
  }

  static async linkStudent(req: Request, res: Response) {
    try {
      const schema = getSchema(req);
      const link = await ParentService.linkStudent(schema, {
        parent_id: req.params.id,
        ...req.body,
      });
      res.status(201).json({ success: true, data: link });
    } catch (error: any) {
      res.status(500).json({ success: false, error });
    }
  }

  static async unlinkStudent(req: Request, res: Response) {
    try {
      const schema = getSchema(req);
      await ParentService.unlinkStudent(schema, req.params.id, req.params.studentId);
      res.json({ success: true, message: 'Lien supprimé' });
    } catch (error: any) {
      res.status(500).json({ success: false, error });
    }
  }
}