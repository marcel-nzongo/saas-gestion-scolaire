'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle, AlertTriangle, XCircle, Clock, Eye, Shield } from 'lucide-react';
import { academicApi, academicYearApi } from '@/lib/academic-api';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

const TYPES = [
  { value: 'observation', label: 'Observation', color: 'bg-gray-100 text-gray-700 border-gray-300', icon: Eye },
  { value: 'avertissement', label: 'Avertissement', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: AlertTriangle },
  { value: 'retenue', label: 'Retenue', color: 'bg-orange-100 text-orange-700 border-orange-300', icon: Clock },
  { value: 'convocation', label: 'Convocation', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: Shield },
  { value: 'exclusion', label: 'Exclusion', color: 'bg-red-100 text-red-700 border-red-300', icon: XCircle },
];

const getTypeMeta = (type: string) => TYPES.find(t => t.value === type) || TYPES[0];

export default function DisciplinePage() {
  const [academicYear, setAcademicYear] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [filterType, setFilterType] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterResolved, setFilterResolved] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    student_id: '',
    type: 'avertissement',
    reason: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    Promise.all([
      academicYearApi.getCurrent(),
      academicApi.get('/students'),
      academicApi.get('/classes'),
    ]).then(([yearRes, studentsRes, classesRes]) => {
      setAcademicYear(yearRes.data.data);
      setStudents(studentsRes.data.data || []);
      setClasses(classesRes.data.data || []);
    });
  }, []);

  useEffect(() => {
    if (!academicYear) return;
    fetchRecords();
    fetchStats();
  }, [academicYear, filterType, filterClass, filterResolved]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      let url = `/discipline?academic_year_id=${academicYear.id}`;
      if (filterType) url += `&type=${filterType}`;
      if (filterClass) url += `&class_id=${filterClass}`;
      if (filterResolved !== '') url += `&resolved=${filterResolved}`;
      const res = await academicApi.get(url);
      setRecords(res.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    const res = await academicApi.get(`/discipline/stats?academic_year_id=${academicYear.id}`);
    setStats(res.data.data);
  };

  const handleCreate = async () => {
    if (!form.student_id || !form.reason) return;
    setSaving(true);
    try {
      await academicApi.post('/discipline', { ...form, academic_year_id: academicYear.id });
      setShowModal(false);
      setForm({ student_id: '', type: 'avertissement', reason: '', description: '', date: new Date().toISOString().split('T')[0] });
      await fetchRecords();
      await fetchStats();
    } finally {
      setSaving(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedRecord) return;
    setSaving(true);
    try {
      await academicApi.patch(`/discipline/${selectedRecord.id}/resolve`, { resolution_notes: resolutionNotes });
      setShowResolveModal(false);
      setResolutionNotes('');
      await fetchRecords();
      await fetchStats();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette sanction ?')) return;
    await academicApi.delete(`/discipline/${id}`);
    await fetchRecords();
    await fetchStats();
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Discipline</h1>
          <p className="text-gray-500 mt-1">{academicYear?.name}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Nouvelle sanction
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-black text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500 mt-1">Total</p>
          </div>
          <div className="bg-orange-50 rounded-xl border border-orange-200 p-4 text-center">
            <p className="text-2xl font-black text-orange-600">{stats.pending}</p>
            <p className="text-xs text-gray-500 mt-1">En cours</p>
          </div>
          <div className="bg-green-50 rounded-xl border border-green-200 p-4 text-center">
            <p className="text-2xl font-black text-green-600">{stats.resolved}</p>
            <p className="text-xs text-gray-500 mt-1">Résolus</p>
          </div>
          <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4 text-center">
            <p className="text-2xl font-black text-yellow-600">{stats.byType?.avertissement || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Avertissements</p>
          </div>
          <div className="bg-red-50 rounded-xl border border-red-200 p-4 text-center">
            <p className="text-2xl font-black text-red-600">{stats.byType?.exclusion || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Exclusions</p>
          </div>
        </div>
      )}

      {/* Filtres */}
      <Card className="mb-6">
        <div className="p-4 flex gap-4 flex-wrap">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">Tous les types</option>
            {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">Toutes les classes</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select
            value={filterResolved}
            onChange={(e) => setFilterResolved(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">Tous les statuts</option>
            <option value="false">En cours</option>
            <option value="true">Résolus</option>
          </select>
          <p className="text-sm text-gray-400 self-center">{records.length} enregistrement{records.length > 1 ? 's' : ''}</p>
        </div>
      </Card>

      {/* Liste */}
      <Card padding="none">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full" />
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-16">
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Aucune sanction enregistrée</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Élève</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Classe</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Motif</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {records.map((record) => {
                const meta = getTypeMeta(record.type);
                const Icon = meta.icon;
                return (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="text-sm font-medium text-gray-900">
                        {record.student_last_name} {record.student_first_name}
                      </p>
                      <p className="text-xs text-gray-400">{record.student_code}</p>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{record.class_name || '—'}</td>
                    <td className="py-3 px-4">
                      <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border', meta.color)}>
                        <Icon className="w-3 h-3" />
                        {meta.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700 max-w-48 truncate">{record.reason}</td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {new Date(record.date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-3 px-4">
                      {record.resolved ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-300">
                          <CheckCircle className="w-3 h-3" />Résolu
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-300">
                          <Clock className="w-3 h-3" />En cours
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {!record.resolved && (
                          <button
                            onClick={() => { setSelectedRecord(record); setShowResolveModal(true); }}
                            className="text-xs text-green-600 hover:text-green-800 font-medium"
                          >
                            Résoudre
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {/* Modal nouvelle sanction */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Nouvelle sanction</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Élève *</label>
                <select
                  value={form.student_id}
                  onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">-- Choisir un élève --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.last_name} {s.first_name} {s.class_name ? `(${s.class_name})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Type *</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Date *</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Motif *</label>
                <input
                  type="text"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="Ex: Comportement perturbateur en classe"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Description (optionnel)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="Détails supplémentaires..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                Annuler
              </button>
              <button
                onClick={handleCreate}
                disabled={saving || !form.student_id || !form.reason}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />Sauvegarde...</> : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal résolution */}
      {showResolveModal && selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Résoudre la sanction</h2>
              <p className="text-sm text-gray-500 mt-1">
                {selectedRecord.student_last_name} {selectedRecord.student_first_name} · {getTypeMeta(selectedRecord.type).label}
              </p>
            </div>
            <div className="p-6">
              <label className="block text-xs font-medium text-gray-500 mb-1">Notes de résolution</label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                rows={4}
                placeholder="Décrivez comment la situation a été résolue..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={() => setShowResolveModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                Annuler
              </button>
              <button
                onClick={handleResolve}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />...</> : <><CheckCircle className="w-4 h-4" />Marquer résolu</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
