'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, CreditCard, Search } from 'lucide-react';
import { academicApi, academicYearApi } from '@/lib/academic-api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

const paymentMethodLabels: Record<string, string> = {
  cash: 'Espèces',
  bank_transfer: 'Virement',
  mobile_money: 'Mobile Money',
  check: 'Chèque',
};

const paymentMethodColors: Record<string, string> = {
  cash: 'bg-green-100 text-green-700',
  bank_transfer: 'bg-blue-100 text-blue-700',
  mobile_money: 'bg-purple-100 text-purple-700',
  check: 'bg-orange-100 text-orange-700',
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [academicYear, setAcademicYear] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    student_id: '',
    fee_id: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    reference: '',
    notes: '',
  });

  useEffect(() => {
    Promise.all([
      academicYearApi.getCurrent(),
      academicApi.get('/classes'),
      academicApi.get('/students'),
    ]).then(([yearRes, classRes, studentsRes]) => {
      setAcademicYear(yearRes.data.data);
      setClasses(classRes.data.data || []);
      setStudents(studentsRes.data.data || []);
    });
  }, []);

  useEffect(() => {
    if (!academicYear) return;
    loadPayments();
    academicApi.get(`/finance/fees?academic_year_id=${academicYear.id}`)
      .then((res) => setFees(res.data.data || []));
  }, [academicYear, selectedClassId]);

  const loadPayments = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        academic_year_id: academicYear.id,
        ...(selectedClassId && { class_id: selectedClassId }),
      });
      const res = await academicApi.get(`/finance/payments?${params}`);
      setPayments(res.data.data || []);
    } catch {
      console.error('Erreur');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.student_id || !form.fee_id || !form.amount) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    try {
      await academicApi.post('/finance/payments', {
        ...form,
        academic_year_id: academicYear.id,
        amount: Number(form.amount),
      });
      await loadPayments();
      setShowModal(false);
      setForm({
        student_id: '', fee_id: '', amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash', reference: '', notes: '',
      });
    } catch {
      alert("Erreur lors de l'enregistrement");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce paiement ?')) return;
    try {
      await academicApi.delete(`/finance/payments/${id}`);
      await loadPayments();
    } catch {
      alert('Erreur lors de la suppression');
    }
  };

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';

  const filteredPayments = payments.filter((p) =>
    `${p.student_first_name} ${p.student_last_name} ${p.student_code}`
      .toLowerCase().includes(search.toLowerCase())
  );

  // Quand un élève est sélectionné, pré-remplir le montant du frais
  const handleFeeChange = (feeId: string) => {
    const fee = fees.find((f) => f.id === feeId);
    setForm({ ...form, fee_id: feeId, amount: fee ? String(fee.amount) : '' });
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paiements</h1>
          <p className="text-gray-500 mt-1">{academicYear?.name}</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Enregistrer un paiement
        </Button>
      </div>

      {/* Filtres */}
      <Card className="mb-6">
        <div className="flex gap-4 p-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un élève..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Toutes les classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Liste */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="text-center py-16">
          <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucun paiement trouvé</p>
        </div>
      ) : (
        <Card padding="sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Élève</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Type de frais</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Méthode</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Montant</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <p className="text-sm font-medium text-gray-900">
                      {p.student_last_name} {p.student_first_name}
                    </p>
                    <p className="text-xs text-gray-400">{p.student_code}</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm text-gray-600">{p.fee_type_name}</p>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={cn(
                      'text-xs px-2 py-1 rounded-full font-medium',
                      paymentMethodColors[p.payment_method] || 'bg-gray-100 text-gray-600',
                    )}>
                      {paymentMethodLabels[p.payment_method] || p.payment_method}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <p className="text-sm text-gray-600">
                      {new Date(p.payment_date).toLocaleDateString('fr-FR')}
                    </p>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <p className="text-sm font-bold text-green-600">
                      {formatAmount(Number(p.amount))}
                    </p>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleDelete(p.id)}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold">Enregistrer un paiement</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Élève *</label>
                <select
                  value={form.student_id}
                  onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner un élève</option>
                  {students.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.last_name} {s.first_name} — {s.class_name || 'Sans classe'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Type de frais *</label>
                <select
                  value={form.fee_id}
                  onChange={(e) => handleFeeChange(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner</option>
                  {fees.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.fee_type_name} — {new Intl.NumberFormat('fr-FR').format(f.amount)} FCFA
                      {f.class_name ? ` (${f.class_name})` : ' (Toutes classes)'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Montant (FCFA) *</label>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Date *</label>
                  <input
                    type="date"
                    value={form.payment_date}
                    onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Méthode de paiement</label>
                <select
                  value={form.payment_method}
                  onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cash">Espèces</option>
                  <option value="bank_transfer">Virement bancaire</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="check">Chèque</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Référence</label>
                <input
                  type="text"
                  value={form.reference}
                  onChange={(e) => setForm({ ...form, reference: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Numéro de reçu ou référence"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
              <Button variant="secondary" onClick={() => setShowModal(false)}>Annuler</Button>
              <Button onClick={handleSubmit}>Enregistrer</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}