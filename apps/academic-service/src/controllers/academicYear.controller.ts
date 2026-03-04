import { Request, Response, NextFunction } from 'express';
import { AcademicYearService } from '../services/academicYear.service';
import { createSuccessResponse } from '@educore/shared';

export class AcademicYearController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = (req as any).user.tsc;
      const years = await AcademicYearService.getAll(schema);
      res.json(createSuccessResponse(years));
    } catch (error) {
      next(error);
    }
  }

  static async getCurrent(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = (req as any).user.tsc;
      const year = await AcademicYearService.getCurrent(schema);
      res.json(createSuccessResponse(year));
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = (req as any).user.tsc;
      const year = await AcademicYearService.create(schema, req.body);
      res.status(201).json(createSuccessResponse(year, 'Année scolaire créée'));
    } catch (error) {
      next(error);
    }
  }
}
