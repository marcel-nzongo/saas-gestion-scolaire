import { Request, Response } from 'express';
import { FinanceService } from '../services/finance.service';

const getSchema = (req: Request) => (req as any).user?.tsc || 'tenant_test';
const getUserId = (req: Request) => (req as any).user?.sub;

export class FinanceController {

  static async getFeeTypes(req: Request, res: Response) {
    try {
      const data = await FinanceService.getFeeTypes(getSchema(req));
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error });
    }
  }

  static async createFeeType(req: Request, res: Response) {
    try {
      const data = await FinanceService.createFeeType(getSchema(req), req.body);
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error });
    }
  }

  static async getFees(req: Request, res: Response) {
    try {
      const { academic_year_id, class_id } = req.query;
      const data = await FinanceService.getFees(getSchema(req), {
        academic_year_id: academic_year_id as string,
        class_id: class_id as string,
      });
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error });
    }
  }

  static async createFee(req: Request, res: Response) {
    try {
      const data = await FinanceService.createFee(getSchema(req), req.body);
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error });
    }
  }

  static async deleteFee(req: Request, res: Response) {
    try {
      await FinanceService.deleteFee(getSchema(req), req.params.id);
      res.json({ success: true, message: 'Supprimé' });
    } catch (error: any) {
      res.status(500).json({ success: false, error });
    }
  }

  static async getPayments(req: Request, res: Response) {
    try {
      const { student_id, academic_year_id, class_id, fee_id } = req.query;
      const data = await FinanceService.getPayments(getSchema(req), {
        student_id: student_id as string,
        academic_year_id: academic_year_id as string,
        class_id: class_id as string,
        fee_id: fee_id as string,
      });
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error });
    }
  }

  static async createPayment(req: Request, res: Response) {
    try {
      const data = await FinanceService.createPayment(getSchema(req), {
        ...req.body,
        received_by: getUserId(req),
      });
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error });
    }
  }

  static async deletePayment(req: Request, res: Response) {
    try {
      await FinanceService.deletePayment(getSchema(req), req.params.id);
      res.json({ success: true, message: 'Supprimé' });
    } catch (error: any) {
      res.status(500).json({ success: false, error });
    }
  }

  static async getStudentBalance(req: Request, res: Response) {
    try {
      const { student_id, academic_year_id } = req.query;
      const data = await FinanceService.getStudentBalance(
        getSchema(req),
        student_id as string,
        academic_year_id as string,
      );
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(error.status || 500).json({ success: false, error });
    }
  }

  static async getStats(req: Request, res: Response) {
    try {
      const { academic_year_id } = req.query;
      const data = await FinanceService.getStats(
        getSchema(req),
        academic_year_id as string,
      );
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error });
    }
  }

  static async getClassBalance(req: Request, res: Response) {
    try {
      const { class_id, academic_year_id } = req.query;
      const data = await FinanceService.getClassBalance(
        getSchema(req),
        class_id as string,
        academic_year_id as string,
      );
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error });
    }
  }
}