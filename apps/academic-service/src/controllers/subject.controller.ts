import { Request, Response, NextFunction } from 'express';
import { SubjectService } from '../services/subject.service';
import { createSuccessResponse } from '@educore/shared';

export class SubjectController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = (req as any).user.tsc;
      const subjects = await SubjectService.getAll(schema);
      res.json(createSuccessResponse(subjects));
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = (req as any).user.tsc;
      const subject = await SubjectService.create(schema, req.body);
      res.status(201).json(createSuccessResponse(subject, 'Matière créée'));
    } catch (error) {
      next(error);
    }
  }
}
