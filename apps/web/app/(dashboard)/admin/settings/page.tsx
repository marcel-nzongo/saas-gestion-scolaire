'use client';

import { useState, useEffect } from 'react';
import {
  Settings, School, BookOpen, Bell, Save, CheckCircle,
} from 'lucide-react';
import { academicApi } from '@/lib/academic-api';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

const TABS = [
  { key: 'general', label: 'Établissement', icon: School },
  { key: 'academic', label: 'Académique', icon: BookOpen },
  { key: 'notifications', label: 'Notifications', icon: Bell },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<Record<string, Record<string, string>>>({});
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    academicApi.get('/settings')
      .then((res) => {
        const data = res.data.data;
        setSettings(data);
        // Aplatir pour le formulaire
        const flat: Record<string, string> = {};
        for (const cat of Object.values(data)) {
          Object.assign(flat, cat);
        }
        setForm(flat);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await academicApi.put('/settings', form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const Input = ({ label, fieldKey, type = 'text', placeholder = '' }: {
    label: string; fieldKey: string; type?: string; placeholder?: string;
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={form[fieldKey] ?? ''}
        onChange={(e) => handleChange(fieldKey, e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );

  const Toggle = ({ label, fieldKey, description }: {
    label: string; fieldKey: string; description?: string;
  }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => handleChange(fieldKey, form[fieldKey] === 'true' ? 'false' : 'true')}
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors',
          form[fieldKey] === 'true' ? 'bg-blue-600' : 'bg-gray-300'
        )}
      >
        <span className={cn(
          'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
          form[fieldKey] === 'true' ? 'translate-x-5' : 'translate-x-0.5'
        )} />
      </button>
    </div>
  );

  const Select = ({ label, fieldKey, options }: {
    label: string; fieldKey: string; options: { value: string; label: string }[];
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        value={form[fieldKey] ?? ''}
        onChange={(e) => handleChange(fieldKey, e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-6 h-6" /> Paramètres
          </h1>
          <p className="text-gray-500 mt-1">Configuration de l'établissement</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-colors',
            saved ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700',
            saving && 'opacity-50'
          )}
        >
          {saved ? (
            <><CheckCircle className="w-4 h-4" />Enregistré !</>
          ) : saving ? (
            <><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />Enregistrement...</>
          ) : (
            <><Save className="w-4 h-4" />Enregistrer</>
          )}
        </button>
      </div>

      <div className="flex gap-6">
        {/* Tabs verticaux */}
        <div className="w-48 shrink-0">
          <nav className="space-y-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left',
                    activeTab === tab.key
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Contenu */}
        <div className="flex-1">
          {/* Établissement */}
          {activeTab === 'general' && (
            <Card>
              <div className="p-6 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Informations de l'établissement</h2>
                <p className="text-xs text-gray-500 mt-1">Ces informations apparaissent sur les bulletins et certificats</p>
              </div>
              <div className="p-6 grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <Input label="Nom de l'établissement" fieldKey="school_name" placeholder="École EduCore" />
                </div>
                <Input label="Directeur" fieldKey="school_director" placeholder="Nom du directeur" />
                <Select label="Type d'établissement" fieldKey="school_type" options={[
                  { value: 'Privé', label: 'Privé' },
                  { value: 'Public', label: 'Public' },
                  { value: 'Franco-arabe', label: 'Franco-arabe' },
                ]} />
                <div className="col-span-2">
                  <Input label="Adresse" fieldKey="school_address" placeholder="Dakar, Sénégal" />
                </div>
                <Input label="Téléphone" fieldKey="school_phone" placeholder="+221 33 000 00 00" />
                <Input label="Email" fieldKey="school_email" type="email" placeholder="contact@ecole.sn" />
                <div className="col-span-2">
                  <Input label="Site web" fieldKey="school_website" placeholder="https://www.ecole.sn" />
                </div>
                <div className="col-span-2">
                  <Input label="Devise / Motto" fieldKey="school_motto" placeholder="L'excellence au service de l'éducation" />
                </div>
              </div>
            </Card>
          )}

          {/* Académique */}
          {activeTab === 'academic' && (
            <Card>
              <div className="p-6 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Paramètres académiques</h2>
                <p className="text-xs text-gray-500 mt-1">Configuration des notes et de l'assiduité</p>
              </div>
              <div className="p-6 grid grid-cols-2 gap-5">
                <Select label="Note maximale" fieldKey="grading_max" options={[
                  { value: '20', label: 'Sur 20' },
                  { value: '10', label: 'Sur 10' },
                  { value: '100', label: 'Sur 100' },
                ]} />
                <Input label="Note de passage" fieldKey="passing_grade" type="number" placeholder="10" />
                <Select label="Nombre de trimestres" fieldKey="terms_count" options={[
                  { value: '2', label: '2 semestres' },
                  { value: '3', label: '3 trimestres' },
                ]} />
                <Input
                  label="Délai justification absences (heures)"
                  fieldKey="attendance_justify_delay"
                  type="number"
                  placeholder="48"
                />
              </div>
            </Card>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <Card>
              <div className="p-6 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Paramètres de notifications</h2>
                <p className="text-xs text-gray-500 mt-1">Gérez les canaux et déclencheurs de notifications</p>
              </div>
              <div className="p-6">
                <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Canaux</p>
                <Toggle label="Notifications Email" fieldKey="email_enabled" description="Envoyer des notifications par email aux parents" />
                <Toggle label="Notifications SMS" fieldKey="sms_enabled" description="Envoyer des SMS via Orange Money API" />

                <p className="text-xs font-semibold text-gray-400 uppercase mt-6 mb-3">Déclencheurs</p>
                <Toggle label="Absences" fieldKey="notify_absences" description="Notifier les parents en cas d'absence" />
                <Toggle label="Notes publiées" fieldKey="notify_grades" description="Notifier les parents lors de la publication des notes" />
                <Toggle label="Bulletins disponibles" fieldKey="notify_bulletins" description="Notifier les parents quand les bulletins sont prêts" />
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
