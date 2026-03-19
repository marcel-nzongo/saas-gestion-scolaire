import { Request, Response } from 'express';
import { BulletinService } from '../services/bulletin.service';

const getSchema = (req: Request) => (req as any).user?.tsc || 'tenant_test';

export class BulletinController {
  static async generatePDF(req: Request, res: Response) {
    try {
      const { studentId } = req.params;
      const { academic_year_id, trimester } = req.query;
      if (!academic_year_id || !trimester) {
        return res.status(400).json({
          success: false,
          message: 'academic_year_id et trimester sont requis',
        });
      }
      const pdfBuffer = await BulletinService.generateBulletinPDF(
        getSchema(req),
        studentId,
        academic_year_id as string,
        parseInt(trimester as string),
      );
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="bulletin_${studentId}_T${trimester}.pdf"`,
      );
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error('Erreur génération PDF:', error);
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Erreur lors de la génération du bulletin',
      });
    }
  }

  static async generateAnnualPDF(req: Request, res: Response) {
    try {
      const { studentId } = req.params;
      const { academic_year_id } = req.query;
      if (!academic_year_id) {
        return res
          .status(400)
          .json({ success: false, message: 'academic_year_id est requis' });
      }
      const pdfBuffer = await BulletinService.generateAnnualPDF(
        getSchema(req),
        studentId,
        academic_year_id as string,
      );
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="bulletin_annuel_${studentId}.pdf"`,
      );
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error('Erreur génération PDF annuel:', error);
      res.status(error.status || 500).json({
        success: false,
        message:
          error.message || 'Erreur lors de la génération du bulletin annuel',
      });
    }
  }

  static async getBulletinData(req: Request, res: Response) {
    try {
      const { studentId } = req.params;
      const { academic_year_id, trimester } = req.query;
      if (!academic_year_id || !trimester) {
        return res.status(400).json({
          success: false,
          message: 'academic_year_id et trimester sont requis',
        });
      }
      const data = await BulletinService.getStudentBulletinData(
        getSchema(req),
        studentId,
        academic_year_id as string,
        parseInt(trimester as string),
      );
      res.json({ success: true, data });
    } catch (error: any) {
      console.error('Erreur récupération données bulletin:', error);
      res
        .status(error.status || 500)
        .json({ success: false, message: error.message || 'Erreur' });
    }
  }
  static async getRanking(req: Request, res: Response) {
    try {
      const { studentId } = req.params;
      const { academic_year_id, trimester } = req.query;
      if (!academic_year_id || !trimester) {
        return res
          .status(400)
          .json({ success: false, message: 'Paramètres manquants' });
      }
      const data = await BulletinService.getClassRanking(
        getSchema(req),
        studentId,
        academic_year_id as string,
        parseInt(trimester as string),
      );
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
  static async getAnnualData(req: Request, res: Response) {
    try {
      const { studentId } = req.params;
      const { academic_year_id } = req.query;
      if (!academic_year_id) {
        return res
          .status(400)
          .json({ success: false, message: 'academic_year_id est requis' });
      }
      const data = await BulletinService.getStudentAnnualData(
        getSchema(req),
        studentId,
        academic_year_id as string,
      );
      res.json({ success: true, data });
    } catch (error: any) {
      res
        .status(error.status || 500)
        .json({ success: false, message: error.message });
    }
  }
}
