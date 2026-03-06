'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, CheckCircle, XCircle, Clock } from 'lucide-react';
import { academicApi, academicYearApi } from '@/lib/academic-api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export default function AttendancePage() {
  const [attendances, setAttendances] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [academicYear, setAcademicYear] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [form, setForm] = useState({
    student_id: '',
    class_id: '',
    date: new Date().toISOString().split('T')[0],
    type: 'absence',
    duration_minutes: '',
    reason: '',
    is_justified: false,
  });

  useEffect(() => {
    Promise.all([
      academicYearApi.getCurrent(),
      academicApi.get('/classes'),
    ]).then(([yearRes, classRes]) => {
      setAcademicYear(yearRes.data.data);
      setClasses(classRes.data.data || []);
    });
  }, []);

  useEffect(() => {
    if (!academicYear) return;
    loadAttendances();
  }, [academicYear, selectedClassId, selectedType]);

  const loadAttendances = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        academic_year_id: academicYear.id,
        ...(selectedClassId && { class_id: selectedClassId }),
        ...(selectedType && { type: selectedType }),
      });
      const res = await academicApi.get(`/attendances?${params}`);
      setAttendances(res.data.data || []);
    } catch {
      console.error('Erreur chargement absences');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!form.class_id) { setStudents([]); return; }
    academicApi.get(`/classes/${form.class_id}/students`)
      .then((res) => setStudents(res.data.data || []));
  }, [form.class_id]);

  const handleSubmit = async () => {
    if (!form.student_id || !form.class_id || !form.date) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    try {
      await academicApi.post('/attendances', {
        ...form,
        academic_year_id: academicYear.id,
        duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
      });
      await loadAttendances();
      setShowModal(false);
      setForm({
        student_id: '', class_id: '',
        date: new Date().toISOString().split('T')[0],
        type: 'absence', duration_minutes: '',
        reason: '', is_justified: false,
      });
    } catch {
      alert("Erreur lors de l'enregistrement");
    }
  };

  const handleJustify = async (id: string, isJustified: boolean) => {
    try {
      await academicApi.put(`/attendances/${id}`, { is_justified: isJustified });
      await loadAttendances();
    } catch {
      alert('Erreur lors de la justification');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet enregistrement ?')) return;
    try {
      await academicApi.delete(`/attendances/${id}`);
      await loadAttendances();
    } catch {
      alert('Erreur lors de la suppression');
    }
  };

  const stats = {
    absences: attendances.filter((a) => a.type === 'absence').length,
    justified: attendances.filter((a) => a.type === 'absence' && a.is_justified).length,
    lates: attendances.filter((a) => a.type === 'late').length,
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Absences & Retards
          </h1>
          <p className="text-gray-500 mt-1">{academicYear?.name}</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Enregistrer
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card padding="sm">
          <div className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Absences</p>
              <p className="text-2xl font-bold text-gray-900">{stats.absences}</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Justifiées</p>
              <p className="text-2xl font-bold text-gray-900">{stats.justified}</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Retards</p>
              <p className="text-2xl font-bold text-gray-900">{stats.lates}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtres */}
      <Card className="mb-6">
        <div className="flex gap-4 p-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Classe
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Toutes les classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous</option>
              <option value="absence">Absences</option>
              <option value="late">Retards</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Liste */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : attendances.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucun enregistrement</p>
        </div>
      ) : (
        <Card padding="sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                  Élève
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                  Classe
                </th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                  Date
                </th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                  Type
                </th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                  Statut
                </th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {attendances.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <p className="text-sm font-medium text-gray-900">
                      {a.student_last_name} {a.student_first_name}
                    </p>
                    <p className="text-xs text-gray-400">{a.student_code}</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm text-gray-600">{a.class_name}</p>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <p className="text-sm text-gray-600">
                      {new Date(a.date).toLocaleDateString('fr-FR')}
                    </p>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={cn(
                      'text-xs px-2 py-1 rounded-full font-medium',
                      a.type === 'absence'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-orange-100 text-orange-700',
                    )}>
                      {a.type === 'absence' ? 'Absence' : `Retard ${a.duration_minutes ? `(${a.duration_minutes}min)` : ''}`}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {a.type === 'absence' ? (
                      <span className={cn(
                        'text-xs px-2 py-1 rounded-full font-medium',
                        a.is_justified
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500',
                      )}>
                        {a.is_justified ? 'Justifiée' : 'Non justifiée'}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {a.type === 'absence' && !a.is_justified && (
                        <button
                          onClick={() => handleJustify(a.id, true)}
                          className="text-xs text-green-600 hover:bg-green-50 px-2 py-1 rounded-lg transition-colors"
                        >
                          Justifier
                        </button>
                      )}
                      {a.type === 'absence' && a.is_justified && (
                        <button
                          onClick={() => handleJustify(a.id, false)}
                          className="text-xs text-orange-600 hover:bg-orange-50 px-2 py-1 rounded-lg transition-colors"
                        >
                          Annuler
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                Enregistrer une absence/retard
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Classe *
                  </label>
                  <select
                    value={form.class_id}
                    onChange={(e) => setForm({ ...form, class_id: e.target.value, student_id: '' })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Élève *
                  </label>
                  <select
                    value={form.student_id}
                    onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                    disabled={!form.class_id}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <option value="">Sélectionner</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.last_name} {s.first_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Type *
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="absence">Absence</option>
                    <option value="late">Retard</option>
                  </select>
                </div>
              </div>
              {form.type === 'late' && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Durée du retard (minutes)
                  </label>
                  <input
                    type="number"
                    value={form.duration_minutes}
                    onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ex: 15"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Motif
                </label>
                <textarea
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Motif optionnel..."
                  rows={2}
                />
              </div>
              {form.type === 'absence' && (
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_justified"
                    checked={form.is_justified}
                    onChange={(e) => setForm({ ...form, is_justified: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="is_justified" className="text-sm text-gray-700">
                    Absence justifiée
                  </label>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Annuler
              </Button>
              <Button onClick={handleSubmit}>
                Enregistrer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}