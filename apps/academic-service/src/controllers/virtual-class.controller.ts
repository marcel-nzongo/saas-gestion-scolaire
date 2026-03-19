// virtual-class.controller.ts
import { Request, Response } from 'express';
import { VirtualClassService } from '../services/virtual-class.service';

const getSchema = (req: Request) => (req as any).user?.tsc || 'tenant_test';
const getUserId = (req: Request) => (req as any).user?.sub;

export class VirtualClassController {

  static async getAll(req: Request, res: Response) {
    try {
      const { academic_year_id, class_id, teacher_id, status } = req.query;
      const data = await VirtualClassService.getAll(getSchema(req), {
        academic_year_id: academic_year_id as string,
        class_id: class_id as string,
        teacher_id: teacher_id as string,
        status: status as string,
      });
      res.json({ success: true, data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const data = await VirtualClassService.getById(getSchema(req), req.params.id);
      res.json({ success: true, data });
    } catch (e: any) {
      res.status(e.status || 500).json({ success: false, message: e.message });
    }
  }

  static async getMyClasses(req: Request, res: Response) {
    try {
      const db = require('../config/database').getTenantDb(getSchema(req));
      const teacher = await db('teachers').where({ user_id: getUserId(req) }).first();
      if (!teacher) return res.status(404).json({ success: false, message: 'Enseignant non trouvé' });
      const { academic_year_id, status } = req.query;
      const data = await VirtualClassService.getAll(getSchema(req), {
        teacher_id: teacher.id,
        academic_year_id: academic_year_id as string,
        status: status as string,
      });
      res.json({ success: true, data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  static async getByStudent(req: Request, res: Response) {
    try {
      const db = require('../config/database').getTenantDb(getSchema(req));
      const student = await db('students').where({ user_id: getUserId(req) }).first();
      if (!student) return res.status(404).json({ success: false, message: 'Élève non trouvé' });
      const { academic_year_id } = req.query;
      const data = await VirtualClassService.getByStudent(getSchema(req), student.id, academic_year_id as string);
      res.json({ success: true, data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const data = await VirtualClassService.create(getSchema(req), req.body);
      res.status(201).json({ success: true, data });
    } catch (e: any) {
      res.status(e.status || 500).json({ success: false, message: e.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const data = await VirtualClassService.update(getSchema(req), req.params.id, req.body);
      res.json({ success: true, data });
    } catch (e: any) {
      res.status(e.status || 500).json({ success: false, message: e.message });
    }
  }

  static async updateStatus(req: Request, res: Response) {
    try {
      const { status } = req.body;
      const data = await VirtualClassService.updateStatus(getSchema(req), req.params.id, status);
      res.json({ success: true, data });
    } catch (e: any) {
      res.status(e.status || 500).json({ success: false, message: e.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      await VirtualClassService.delete(getSchema(req), req.params.id);
      res.json({ success: true, message: 'Séance supprimée' });
    } catch (e: any) {
      res.status(e.status || 500).json({ success: false, message: e.message });
    }
  }

  static async addDocument(req: Request, res: Response) {
    try {
      const data = await VirtualClassService.addDocument(getSchema(req), req.params.id, {
        ...req.body,
        uploaded_by: getUserId(req),
      });
      res.status(201).json({ success: true, data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  static async deleteDocument(req: Request, res: Response) {
    try {
      await VirtualClassService.deleteDocument(getSchema(req), req.params.docId);
      res.json({ success: true, message: 'Document supprimé' });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }
}
