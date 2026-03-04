import { Request, Response, NextFunction } from 'express';
import { StudentService } from '../services/student.service';
import { createSuccessResponse } from '@educore/shared';

export class StudentController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = (req as any).user.tsc;
      const result = await StudentService.getAll(schema, {
        class_id: req.query.class_id as string,
        search: req.query.search as string,
        status: req.query.status as string,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
      });
      res.json(createSuccessResponse(result.data, undefined, result.meta));
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = (req as any).user.tsc;
      const student = await StudentService.getById(schema, req.params.id);
      res.json(createSuccessResponse(student));
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = (req as any).user.tsc;
      const student = await StudentService.create(schema, req.body);
      res
        .status(201)
        .json(createSuccessResponse(student, 'Élève créé avec succès'));
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = (req as any).user.tsc;
      const student = await StudentService.update(
        schema,
        req.params.id,
        req.body,
      );
      res.json(createSuccessResponse(student, 'Élève mis à jour'));
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = (req as any).user.tsc;
      await StudentService.delete(schema, req.params.id);
      res.json(createSuccessResponse(null, 'Élève supprimé'));
    } catch (error) {
      next(error);
    }
  }
}
