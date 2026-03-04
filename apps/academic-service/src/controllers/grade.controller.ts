import { Request, Response, NextFunction } from 'express';
import { GradeService } from '../services/grade.service';
import { createSuccessResponse } from '@educore/shared';

export class GradeController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = (req as any).user.tsc;
      const grades = await GradeService.getAll(schema, {
        student_id: req.query.student_id as string,
        subject_id: req.query.subject_id as string,
        class_id: req.query.class_id as string,
        term: req.query.term ? Number(req.query.term) : undefined,
        academic_year_id: req.query.academic_year_id as string,
      });
      res.json(createSuccessResponse(grades));
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = (req as any).user.tsc;
      const grade = await GradeService.create(schema, {
        ...req.body,
        teacher_id: (req as any).user.sub,
      });
      res
        .status(201)
        .json(createSuccessResponse(grade, 'Note ajoutée avec succès'));
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = (req as any).user.tsc;
      const grade = await GradeService.update(schema, req.params.id, req.body);
      res.json(createSuccessResponse(grade, 'Note modifiée'));
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = (req as any).user.tsc;
      await GradeService.delete(schema, req.params.id);
      res.json(createSuccessResponse(null, 'Note supprimée'));
    } catch (error) {
      next(error);
    }
  }

  static async getStudentAverage(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const schema = (req as any).user.tsc;
      const result = await GradeService.getStudentAverage(
        schema,
        req.params.studentId,
        Number(req.query.term) || 1,
        req.query.academic_year_id as string,
      );
      res.json(createSuccessResponse(result));
    } catch (error) {
      next(error);
    }
  }

  static async generateReportCard(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const schema = (req as any).user.tsc;
      const reportCard = await GradeService.generateReportCard(
        schema,
        req.params.studentId,
        Number(req.body.term),
        req.body.academic_year_id,
      );
      res.json(
        createSuccessResponse(reportCard, 'Bulletin généré avec succès'),
      );
    } catch (error) {
      next(error);
    }
  }

  static async getClassReportCards(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const schema = (req as any).user.tsc;
      const reportCards = await GradeService.getClassReportCards(
        schema,
        req.params.classId,
        Number(req.query.term) || 1,
        req.query.academic_year_id as string,
      );
      res.json(createSuccessResponse(reportCards));
    } catch (error) {
      next(error);
    }
  }

  static async publishTerm(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = (req as any).user.tsc;
      await GradeService.publishTerm(
        schema,
        Number(req.body.term),
        req.body.academic_year_id,
      );
      res.json(createSuccessResponse(null, 'Notes publiées avec succès'));
    } catch (error) {
      next(error);
    }
  }
}
