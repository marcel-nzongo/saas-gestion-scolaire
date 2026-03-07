import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';
import { getTenantDb } from '../config/database';

const getSchema = (req: Request) => (req as any).user?.tsc || 'tenant_test';

export class NotificationController {
  static async sendCustom(req: Request, res: Response) {
    try {
      const { title, message, recipient_type, class_id, student_ids, channel } =
        req.body;
      const schema = getSchema(req);
      const db = getTenantDb(schema);

      let emails: string[] = [];
      let phones: string[] = [];

      if (recipient_type === 'all_parents') {
        const parents = await db('parents as p')
          .join('users as u', 'p.user_id', 'u.id')
          .select('u.email', 'u.phone');
        if (channel !== 'sms')
          emails = parents.map((p: any) => p.email).filter(Boolean);
        if (channel !== 'email')
          phones = parents.map((p: any) => p.phone).filter(Boolean);
      } else if (recipient_type === 'class_parents' && class_id) {
        const parents = await db('student_parents as sp')
          .join('students as s', 'sp.student_id', 's.id')
          .join('parents as p', 'sp.parent_id', 'p.id')
          .join('users as u', 'p.user_id', 'u.id')
          .where('s.class_id', class_id)
          .select('u.email', 'u.phone');
        if (channel !== 'sms')
          emails = parents.map((p: any) => p.email).filter(Boolean);
        if (channel !== 'email')
          phones = parents.map((p: any) => p.phone).filter(Boolean);
      } else if (recipient_type === 'specific' && student_ids?.length) {
        const parents = await db('student_parents as sp')
          .join('parents as p', 'sp.parent_id', 'p.id')
          .join('users as u', 'p.user_id', 'u.id')
          .whereIn('sp.student_id', student_ids)
          .select('u.email', 'u.phone');
        if (channel !== 'sms')
          emails = parents.map((p: any) => p.email).filter(Boolean);
        if (channel !== 'email')
          phones = parents.map((p: any) => p.phone).filter(Boolean);
      }

      const results = await NotificationService.sendCustomNotification({
        emails,
        phones,
        title,
        message,
      });

      res.json({ success: true, data: results });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async testEmail(req: Request, res: Response) {
    try {
      const { email } = req.body;
      const ok = await NotificationService.sendEmail(
        email,
        '✅ Test EduCore',
        '<h2>Connexion email réussie !</h2><p>Votre configuration SMTP fonctionne correctement.</p>',
      );
      res.json({ success: ok, message: ok ? 'Email envoyé !' : 'Échec envoi' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async testSMS(req: Request, res: Response) {
    try {
      const { phone } = req.body;
      const ok = await NotificationService.sendSMS(
        phone,
        'EduCore: Test SMS réussi !',
      );
      res.json({ success: ok, message: ok ? 'SMS envoyé !' : 'Échec envoi' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
