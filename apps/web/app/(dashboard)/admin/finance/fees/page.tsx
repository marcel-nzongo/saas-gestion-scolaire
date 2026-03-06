'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, DollarSign } from 'lucide-react';
import { academicApi, academicYearApi } from '@/lib/academic-api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function FeesPage() {
  const [fees, setFees] = useState<any[]>([]);
  const [feeTypes, setFeeTypes] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [academicYear, setAcademicYear] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    fee_type_id: '',
    class_id: '',
    amount: '',
    due_date: '',
    is_mandatory: true,
  });
  const [typeForm, setTypeForm] = useState({ name: '', description: '' });

  useEffect(() => {
    Promise.all([
      academicYearApi.getCurrent(),
      academicApi.get('/finance/fee-types'),
      academicApi.get('/classes'),
    ]).then(([yearRes, typesRes, classRes]) => {
      setAcademicYear(yearRes.data.data);
      setFeeTypes(typesRes.data.data || []);
      setClasses(classRes.data.data || []);
    });
  }, []);

  useEffect(() => {
    if (!academicYear) return;
    loadFees();
  }, [academicYear]);

  const loadFees = async () => {
    setIsLoading(true);
    try {
      const res = await academicApi.get(
        `/finance/fees?academic_year_id=${academicYear.id}`
      );
      setFees(res.data.data || []);
    } catch {
      console.error('Erreur chargement frais');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.fee_type_id || !form.amount) {
      alert('Veuillez remplir les champs obligatoires');
      return;
    }
    try {
      await academicApi.post('/finance/fees', {
        ...form,
        academic_year_id: academicYear.id,
        amount: Number(form.amount),
        class_id: form.class_id || null,
      });
      await loadFees();
      setShowModal(false);
      setForm({ fee_type_id: '', class_id: '', amount: '', due_date: '', is_mandatory: true });
    } catch {
      alert("Erreur lors de la création");
    }
  };

  const handleCreateType = async () => {
    if (!typeForm.name) return;
    try {
      const res = await academicApi.post('/finance/fee-types', typeForm);
      setFeeTypes([...feeTypes, res.data.data]);
      setShowTypeModal(false);
      setTypeForm({ name: '', description: '' });
    } catch {
      alert("Erreur lors de la création du type");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce frais ?')) return;
    try {
      await academicApi.delete(`/finance/fees/${id}`);
      await loadFees();
    } catch {
      alert('Erreur lors de la suppression');
    }
  };

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des frais</h1>
          <p className="text-gray-500 mt-1">{academicYear?.name}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setShowTypeModal(true)}>
            Nouveau type
          </Button>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau frais
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : fees.length === 0 ? (
        <div className="text-center py-16">
          <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucun frais configuré</p>
        </div>
      ) : (
        <Card padding="sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                  Type de frais
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                  Classe
                </th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                  Obligatoire
                </th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                  Échéance
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                  Montant
                </th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {fees.map((fee) => (
                <tr key={fee.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <p className="text-sm font-medium text-gray-900">
                      {fee.fee_type_name}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm text-gray-600">
                      {fee.class_name || 'Toutes les classes'}
                    </p>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      fee.is_mandatory
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {fee.is_mandatory ? 'Obligatoire' : 'Optionnel'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <p className="text-sm text-gray-600">
                      {fee.due_date
                        ? new Date(fee.due_date).toLocaleDateString('fr-FR')
                        : '—'}
                    </p>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <p className="text-sm font-bold text-gray-900">
                      {formatAmount(Number(fee.amount))}
                    </p>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleDelete(fee.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Modal nouveau frais */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold">Nouveau frais</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Type de frais *
                </label>
                <select
                  value={form.fee_type_id}
                  onChange={(e) => setForm({ ...form, fee_type_id: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner</option>
                  {feeTypes.map((ft) => (
                    <option key={ft.id} value={ft.id}>{ft.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Classe (laisser vide = toutes les classes)
                </label>
                <select
                  value={form.class_id}
                  onChange={(e) => setForm({ ...form, class_id: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Toutes les classes</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Montant (FCFA) *
                  </label>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ex: 50000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Date d'échéance
                  </label>
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_mandatory"
                  checked={form.is_mandatory}
                  onChange={(e) => setForm({ ...form, is_mandatory: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="is_mandatory" className="text-sm text-gray-700">
                  Frais obligatoire
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
              <Button variant="secondary" onClick={() => setShowModal(false)}>Annuler</Button>
              <Button onClick={handleSubmit}>Créer</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal nouveau type */}
      {showTypeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold">Nouveau type de frais</h2>
              <button onClick={() => setShowTypeModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nom *</label>
                <input
                  type="text"
                  value={typeForm.name}
                  onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ex: Bibliothèque"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                <input
                  type="text"
                  value={typeForm.description}
                  onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Description optionnelle"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
              <Button variant="secondary" onClick={() => setShowTypeModal(false)}>Annuler</Button>
              <Button onClick={handleCreateType}>Créer</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}