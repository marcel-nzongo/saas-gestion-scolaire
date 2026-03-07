'use client';

import { useState, useEffect } from 'react';
import { Send, Mail, MessageSquare, Users, BookOpen, User, CheckCircle, XCircle } from 'lucide-react';
import { academicApi } from '@/lib/academic-api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

type RecipientType = 'all_parents' | 'class_parents' | 'specific';
type Channel = 'email' | 'sms' | 'both';

export default function NotificationsPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [testEmail, setTestEmail] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingSMS, setTestingSMS] = useState(false);
  const [testResults, setTestResults] = useState<{ email?: boolean; sms?: boolean }>({});

  const [form, setForm] = useState({
    title: '',
    message: '',
    recipient_type: 'all_parents' as RecipientType,
    channel: 'email' as Channel,
    class_id: '',
    student_ids: [] as string[],
  });

  useEffect(() => {
    Promise.all([
      academicApi.get('/classes'),
      academicApi.get('/students'),
    ]).then(([classRes, studentsRes]) => {
      setClasses(classRes.data.data || []);
      setStudents(studentsRes.data.data || []);
    });
  }, []);

  const handleSend = async () => {
    if (!form.title || !form.message) {
      alert('Veuillez remplir le titre et le message');
      return;
    }
    setIsSending(true);
    setResult(null);
    try {
      const res = await academicApi.post('/notifications/send', {
        title: form.title,
        message: form.message,
        recipient_type: form.recipient_type,
        class_id: form.class_id || undefined,
        student_ids: form.student_ids.length > 0 ? form.student_ids : undefined,
        channel: form.channel,
      });
      setResult({ success: true, data: res.data.data });
    } catch {
      setResult({ success: false });
    } finally {
      setIsSending(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) return;
    setTestingEmail(true);
    try {
      const res = await academicApi.post('/notifications/test-email', { email: testEmail });
      setTestResults((prev) => ({ ...prev, email: res.data.success }));
    } catch {
      setTestResults((prev) => ({ ...prev, email: false }));
    } finally {
      setTestingEmail(false);
    }
  };

  const handleTestSMS = async () => {
    if (!testPhone) return;
    setTestingSMS(true);
    try {
      const res = await academicApi.post('/notifications/test-sms', { phone: testPhone });
      setTestResults((prev) => ({ ...prev, sms: res.data.success }));
    } catch {
      setTestResults((prev) => ({ ...prev, sms: false }));
    } finally {
      setTestingSMS(false);
    }
  };

  const toggleStudent = (id: string) => {
    setForm((prev) => ({
      ...prev,
      student_ids: prev.student_ids.includes(id)
        ? prev.student_ids.filter((s) => s !== id)
        : [...prev.student_ids, id],
    }));
  };

  const recipientOptions = [
    { value: 'all_parents', label: 'Tous les parents', icon: Users },
    { value: 'class_parents', label: 'Parents d\'une classe', icon: BookOpen },
    { value: 'specific', label: 'Élèves spécifiques', icon: User },
  ];

  const channelOptions = [
    { value: 'email', label: 'Email uniquement', icon: Mail },
    { value: 'sms', label: 'SMS uniquement', icon: MessageSquare },
    { value: 'both', label: 'Email + SMS', icon: Send },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="text-gray-500 mt-1">Envoyer des emails et SMS aux parents</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Formulaire principal */}
        <div className="col-span-2 space-y-6">

          {/* Destinataires */}
          <Card>
            <div className="p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Destinataires</h2>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {recipientOptions.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setForm({ ...form, recipient_type: opt.value as RecipientType })}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-sm font-medium',
                        form.recipient_type === opt.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300',
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {/* Sélection classe */}
              {form.recipient_type === 'class_parents' && (
                <select
                  value={form.class_id}
                  onChange={(e) => setForm({ ...form, class_id: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner une classe</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}

              {/* Sélection élèves */}
              {form.recipient_type === 'specific' && (
                <div className="border border-gray-200 rounded-xl max-h-48 overflow-y-auto">
                  {students.map((s: any) => (
                    <label
                      key={s.id}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={form.student_ids.includes(s.id)}
                        onChange={() => toggleStudent(s.id)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-700">
                        {s.last_name} {s.first_name}
                        <span className="text-gray-400 ml-2 text-xs">
                          {s.class_name || 'Sans classe'}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Canal */}
          <Card>
            <div className="p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Canal d'envoi</h2>
              <div className="grid grid-cols-3 gap-3">
                {channelOptions.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setForm({ ...form, channel: opt.value as Channel })}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-sm font-medium',
                        form.channel === opt.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300',
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Message */}
          <Card>
            <div className="p-6 space-y-4">
              <h2 className="font-semibold text-gray-900">Message</h2>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Titre *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Réunion de parents d'élèves"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Message *</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={5}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Rédigez votre message ici..."
                />
                <p className="text-xs text-gray-400 mt-1">
                  {form.message.length} caractères
                  {form.channel !== 'email' && form.message.length > 160 && (
                    <span className="text-orange-500 ml-2">
                      ⚠️ Message long pour SMS ({Math.ceil(form.message.length / 160)} SMS)
                    </span>
                  )}
                </p>
              </div>
            </div>
          </Card>

          {/* Bouton envoi */}
          <Button
            onClick={handleSend}
            disabled={isSending}
            className="w-full py-3"
          >
            {isSending ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Envoi en cours...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Send className="w-4 h-4" />
                Envoyer la notification
              </span>
            )}
          </Button>

          {/* Résultat */}
          {result && (
            <div className={cn(
              'rounded-xl p-4 flex items-start gap-3',
              result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200',
            )}>
              {result.success
                ? <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                : <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
              }
              <div>
                <p className={cn(
                  'font-medium text-sm',
                  result.success ? 'text-green-700' : 'text-red-700',
                )}>
                  {result.success ? 'Notifications envoyées !' : 'Erreur lors de l\'envoi'}
                </p>
                {result.success && result.data && (
                  <p className="text-xs text-green-600 mt-1">
                    {result.data.emails_sent} email(s) · {result.data.sms_sent} SMS · {result.data.errors} erreur(s)
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Panel test */}
        <div className="space-y-4">
          <Card>
            <div className="p-6">
              <h2 className="font-semibold text-gray-900 mb-4">🧪 Tester la configuration</h2>

              {/* Test Email */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Mail className="w-4 h-4 text-blue-500" />
                  <p className="text-sm font-medium text-gray-700">Test Email</p>
                  {testResults.email !== undefined && (
                    testResults.email
                      ? <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                      : <XCircle className="w-4 h-4 text-red-500 ml-auto" />
                  )}
                </div>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="email@test.com"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                />
                <button
                  onClick={handleTestEmail}
                  disabled={testingEmail || !testEmail}
                  className="w-full py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
                >
                  {testingEmail ? 'Envoi...' : 'Envoyer test'}
                </button>
              </div>

              {/* Test SMS */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-4 h-4 text-green-500" />
                  <p className="text-sm font-medium text-gray-700">Test SMS</p>
                  {testResults.sms !== undefined && (
                    testResults.sms
                      ? <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                      : <XCircle className="w-4 h-4 text-red-500 ml-auto" />
                  )}
                </div>
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="+221 77 000 00 00"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                />
                <button
                  onClick={handleTestSMS}
                  disabled={testingSMS || !testPhone}
                  className="w-full py-2 text-sm font-medium text-green-600 border border-green-200 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50"
                >
                  {testingSMS ? 'Envoi...' : 'Envoyer test'}
                </button>
              </div>
            </div>
          </Card>

          {/* Conseils */}
          <Card>
            <div className="p-6">
              <h2 className="font-semibold text-gray-900 mb-3">💡 Conseils</h2>
              <ul className="space-y-2 text-xs text-gray-500">
                <li>• Testez d'abord avec votre propre email/téléphone</li>
                <li>• Les SMS sont limités à 160 caractères</li>
                <li>• Au-delà, le message est découpé en plusieurs SMS</li>
                <li>• Les numéros doivent inclure l'indicatif pays (+221)</li>
                <li>• L'envoi groupé peut prendre quelques secondes</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}