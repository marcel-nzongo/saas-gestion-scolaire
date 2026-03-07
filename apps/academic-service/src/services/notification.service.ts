import nodemailer from 'nodemailer';
import axios from 'axios';

// ── Email Transport ────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true, // ← true pour 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

console.log('📧 SMTP Config:', {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS ? '***défini***' : 'UNDEFINED',
});

// ── Orange SMS Token ───────────────────────────────────────
let orangeToken: string | null = null;
let orangeTokenExpiry: number = 0;

async function getOrangeToken(): Promise<string> {
  if (orangeToken && Date.now() < orangeTokenExpiry) return orangeToken;

  const credentials = Buffer.from(
    `${process.env.ORANGE_SMS_CLIENT_ID}:${process.env.ORANGE_SMS_CLIENT_SECRET}`,
  ).toString('base64');

  const res = await axios.post(
    'https://api.orange.com/oauth/v3/token',
    'grant_type=client_credentials',
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    },
  );

  orangeToken = res.data.access_token;
  orangeTokenExpiry = Date.now() + (res.data.expires_in - 60) * 1000;
  return orangeToken!;
}

// ── Templates Email ────────────────────────────────────────
const emailTemplates = {
  absence: (data: {
    studentName: string;
    date: string;
    type: string;
    reason?: string;
  }) => ({
    subject: `📋 ${data.type === 'absence' ? 'Absence' : 'Retard'} de ${data.studentName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #4F46E5; padding: 24px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">EduCore — Gestion Scolaire</h1>
        </div>
        <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
          <h2 style="color: #111827;">
            ${data.type === 'absence' ? '⚠️ Absence signalée' : '⏰ Retard signalé'}
          </h2>
          <p style="color: #374151;">Bonjour,</p>
          <p style="color: #374151;">
            Nous vous informons que <strong>${data.studentName}</strong> a été signalé(e) 
            <strong>${data.type === 'absence' ? 'absent(e)' : 'en retard'}</strong> 
            le <strong>${data.date}</strong>.
          </p>
          ${data.reason ? `<p style="color: #374151;">Motif : <em>${data.reason}</em></p>` : ''}
          <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
            Pour toute question, contactez l'administration de l'établissement.
          </p>
        </div>
      </div>
    `,
  }),

  payment_reminder: (data: {
    studentName: string;
    amount: number;
    feeType: string;
    dueDate?: string;
  }) => ({
    subject: `💳 Rappel de paiement — ${data.studentName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #4F46E5; padding: 24px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">EduCore — Gestion Scolaire</h1>
        </div>
        <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
          <h2 style="color: #111827;">💳 Rappel de paiement</h2>
          <p style="color: #374151;">Bonjour,</p>
          <p style="color: #374151;">
            Un solde de <strong>${new Intl.NumberFormat('fr-FR').format(data.amount)} FCFA</strong> 
            est en attente pour <strong>${data.studentName}</strong>
            au titre des <strong>${data.feeType}</strong>.
          </p>
          ${data.dueDate ? `<p style="color: #dc2626;">📅 Date d'échéance : <strong>${data.dueDate}</strong></p>` : ''}
          <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
            Merci de régulariser votre situation auprès de l'administration.
          </p>
        </div>
      </div>
    `,
  }),

  payment_confirmed: (data: {
    studentName: string;
    amount: number;
    feeType: string;
    reference?: string;
  }) => ({
    subject: `✅ Paiement confirmé — ${data.studentName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #059669; padding: 24px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">EduCore — Gestion Scolaire</h1>
        </div>
        <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
          <h2 style="color: #111827;">✅ Paiement enregistré</h2>
          <p style="color: #374151;">Bonjour,</p>
          <p style="color: #374151;">
            Le paiement de <strong>${new Intl.NumberFormat('fr-FR').format(data.amount)} FCFA</strong>
            pour <strong>${data.studentName}</strong> — <strong>${data.feeType}</strong> a bien été enregistré.
          </p>
          ${data.reference ? `<p style="color: #374151;">Référence : <strong>${data.reference}</strong></p>` : ''}
          <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">Merci pour votre règlement.</p>
        </div>
      </div>
    `,
  }),

  custom: (data: { title: string; message: string }) => ({
    subject: data.title,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #4F46E5; padding: 24px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">EduCore — Gestion Scolaire</h1>
        </div>
        <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
          <h2 style="color: #111827;">${data.title}</h2>
          <p style="color: #374151; white-space: pre-line;">${data.message}</p>
          <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
            EduCore — Plateforme de gestion scolaire
          </p>
        </div>
      </div>
    `,
  }),
};

// ── SMS Templates ──────────────────────────────────────────
const smsTemplates = {
  absence: (data: { studentName: string; date: string; type: string }) =>
    `EduCore: ${data.studentName} a été signalé(e) ${data.type === 'absence' ? 'absent(e)' : 'en retard'} le ${data.date}.`,

  payment_reminder: (data: { studentName: string; amount: number }) =>
    `EduCore: Rappel - ${new Intl.NumberFormat('fr-FR').format(data.amount)} FCFA en attente pour ${data.studentName}.`,

  payment_confirmed: (data: { studentName: string; amount: number }) =>
    `EduCore: Paiement de ${new Intl.NumberFormat('fr-FR').format(data.amount)} FCFA confirmé pour ${data.studentName}.`,

  custom: (data: { message: string }) => `EduCore: ${data.message}`,
};

export class NotificationService {
  // ── Envoi Email ────────────────────────────────────────
  static async sendEmail(
    to: string,
    subject: string,
    html: string,
  ): Promise<boolean> {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'EduCore <noreply@educore.com>',
        to,
        subject,
        html,
      });
      console.log(`✅ Email envoyé à ${to}`);
      return true;
    } catch (error: any) {
      console.error(`❌ Erreur email: ${error.message}`);
      return false;
    }
  }

  // ── Envoi SMS Orange ───────────────────────────────────
  static async sendSMS(to: string, message: string): Promise<boolean> {
    try {
      const token = await getOrangeToken();
      const sender = process.env.ORANGE_SMS_SENDER || 'EduCore';

      // Formater le numéro (ajouter +221 si nécessaire pour le Sénégal)
      const phone = to.startsWith('+') ? to : `+221${to.replace(/^0/, '')}`;

      await axios.post(
        `https://api.orange.com/smsmessaging/v1/outbound/tel%3A%2B${sender}/requests`,
        {
          outboundSMSMessageRequest: {
            address: [`tel:${phone}`],
            senderAddress: `tel:+${sender}`,
            outboundSMSTextMessage: { message },
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      console.log(`✅ SMS envoyé à ${phone}`);
      return true;
    } catch (error: any) {
      console.error(`❌ Erreur SMS: ${error.message}`);
      return false;
    }
  }

  // ── Notification Absence ───────────────────────────────
  static async notifyAbsence(data: {
    parentEmail?: string;
    parentPhone?: string;
    studentName: string;
    date: string;
    type: 'absence' | 'late';
    reason?: string;
  }) {
    const results = { email: false, sms: false };
    const template = emailTemplates.absence(data);
    const smsText = smsTemplates.absence(data);

    if (data.parentEmail) {
      results.email = await this.sendEmail(
        data.parentEmail,
        template.subject,
        template.html,
      );
    }
    if (data.parentPhone) {
      results.sms = await this.sendSMS(data.parentPhone, smsText);
    }
    return results;
  }

  // ── Rappel Paiement ────────────────────────────────────
  static async notifyPaymentReminder(data: {
    parentEmail?: string;
    parentPhone?: string;
    studentName: string;
    amount: number;
    feeType: string;
    dueDate?: string;
  }) {
    const results = { email: false, sms: false };
    const template = emailTemplates.payment_reminder(data);
    const smsText = smsTemplates.payment_reminder(data);

    if (data.parentEmail) {
      results.email = await this.sendEmail(
        data.parentEmail,
        template.subject,
        template.html,
      );
    }
    if (data.parentPhone) {
      results.sms = await this.sendSMS(data.parentPhone, smsText);
    }
    return results;
  }

  // ── Confirmation Paiement ──────────────────────────────
  static async notifyPaymentConfirmed(data: {
    parentEmail?: string;
    parentPhone?: string;
    studentName: string;
    amount: number;
    feeType: string;
    reference?: string;
  }) {
    const results = { email: false, sms: false };
    const template = emailTemplates.payment_confirmed(data);
    const smsText = smsTemplates.payment_confirmed(data);

    if (data.parentEmail) {
      results.email = await this.sendEmail(
        data.parentEmail,
        template.subject,
        template.html,
      );
    }
    if (data.parentPhone) {
      results.sms = await this.sendSMS(data.parentPhone, smsText);
    }
    return results;
  }

  // ── Notification Manuelle ──────────────────────────────
  static async sendCustomNotification(data: {
    emails?: string[];
    phones?: string[];
    title: string;
    message: string;
  }) {
    const template = emailTemplates.custom(data);
    const smsText = smsTemplates.custom(data);
    const results = { emails_sent: 0, sms_sent: 0, errors: 0 };

    if (data.emails) {
      for (const email of data.emails) {
        const ok = await this.sendEmail(email, template.subject, template.html);
        ok ? results.emails_sent++ : results.errors++;
      }
    }
    if (data.phones) {
      for (const phone of data.phones) {
        const ok = await this.sendSMS(phone, smsText);
        ok ? results.sms_sent++ : results.errors++;
      }
    }
    return results;
  }
}
