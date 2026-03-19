import { Request, Response } from 'express';
import { SettingsService } from '../services/settings.service';

const getSchema = (req: Request) => (req as any).user?.tsc || 'tenant_test';

export class SettingsController {

  static async getAll(req: Request, res: Response) {
    try {
      const data = await SettingsService.getAll(getSchema(req));
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getFlat(req: Request, res: Response) {
    try {
      const data = await SettingsService.getFlat(getSchema(req));
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateMany(req: Request, res: Response) {
    try {
      const updates = req.body;
      if (!updates || typeof updates !== 'object') {
        return res.status(400).json({ success: false, message: 'Corps de requête invalide' });
      }
      const data = await SettingsService.updateMany(getSchema(req), updates);
      res.json({ success: true, data, message: 'Paramètres mis à jour' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
