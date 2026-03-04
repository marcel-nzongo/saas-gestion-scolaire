import { Request, Response, NextFunction } from 'express';
import { ClassService } from '../services/class.service';
import { createSuccessResponse } from '@educore/shared';

export class ClassController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = (req as any).user.tsc;
      const classes = await ClassService.getAll(
        schema,
        req.query.academic_year_id as string,
      );
      res.json(createSuccessResponse(classes));
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = (req as any).user.tsc;
      const cls = await ClassService.getById(schema, req.params.id);
      res.json(createSuccessResponse(cls));
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = (req as any).user.tsc;
      const cls = await ClassService.create(schema, req.body);
      res
        .status(201)
        .json(createSuccessResponse(cls, 'Classe créée avec succès'));
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = (req as any).user.tsc;
      const cls = await ClassService.update(schema, req.params.id, req.body);
      res.json(createSuccessResponse(cls, 'Classe mise à jour'));
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = (req as any).user.tsc;
      await ClassService.delete(schema, req.params.id);
      res.json(createSuccessResponse(null, 'Classe supprimée'));
    } catch (error) {
      next(error);
    }
  }

  static async getStudents(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = (req as any).user.tsc;
      const students = await ClassService.getStudents(schema, req.params.id);
      res.json(createSuccessResponse(students));
    } catch (error) {
      next(error);
    }
  }
}
