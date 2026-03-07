'use client';

import { useState, useEffect } from 'react';
import { DollarSign, CheckCircle, TrendingDown } from 'lucide-react';
import { academicApi, academicYearApi } from '@/lib/academic-api';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

const paymentMethodLabels: Record<string, string> = {
  cash: 'Espèces',
  bank_transfer: 'Virement',
  mobile_money: 'Mobile Money',
  check: 'Chèque',
};

export default function ParentFinancePage() {
  const [parentData, setParentData] = useState<any>(null);
  const [academicYear, setAcademicYear] = useState<any>(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [balance, setBalance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      academicApi.get('/parents/me'),
      academicYearApi.getCurrent(),
    ]).then(([parentRes, yearRes]) => {
      setParentData(parentRes.data.data);
      setAcademicYear(yearRes.data.data);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedStudentId || !academicYear) return;
    setIsLoading(true);
    setBalance(null);
    academicApi.get(
      `/finance/student-balance?student_id=${selectedStudentId}&academic_year_id=${academicYear.id}`
    ).then((res) => setBalance(res.data.data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [selectedStudentId, academicYear]);

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Paiements scolaires</h1>
        <p className="text-gray-500 mt-1">Suivi des frais de scolarité</p>
      </div>

      {/* Sélection enfant */}
      <Card className="mb-6">
        <div className="p-4">
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Sélectionner un enfant *
          </label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">-- Choisir --</option>
            {parentData?.students?.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.last_name} {s.first_name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {!selectedStudentId ? (
        <div className="text-center py-16">
          <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            Sélectionnez un enfant pour voir ses frais
          </p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
        </div>
      ) : balance ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card padding="sm">
              <div className="flex items-center gap-3 p-4">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total frais</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatAmount(balance.total_fees)}
                  </p>
                </div>
              </div>
            </Card>
            <Card padding="sm">
              <div className="flex items-center gap-3 p-4">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Payé</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatAmount(balance.total_paid)}
                  </p>
                </div>
              </div>
            </Card>
            <Card padding="sm">
              <div className="flex items-center gap-3 p-4">
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  balance.balance > 0 ? 'bg-red-50' : 'bg-green-50',
                )}>
                  <TrendingDown className={cn(
                    'w-5 h-5',
                    balance.balance > 0 ? 'text-red-500' : 'text-green-500',
                  )} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Restant</p>
                  <p className={cn(
                    'text-lg font-bold',
                    balance.balance > 0 ? 'text-red-600' : 'text-green-600',
                  )}>
                    {formatAmount(balance.balance)}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Statut global */}
          <div className={cn(
            'rounded-xl p-4 mb-6 flex items-center gap-3',
            balance.is_paid
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200',
          )}>
            <CheckCircle className={cn(
              'w-5 h-5',
              balance.is_paid ? 'text-green-600' : 'text-red-500',
            )} />
            <p className={cn(
              'font-medium text-sm',
              balance.is_paid ? 'text-green-700' : 'text-red-700',
            )}>
              {balance.is_paid
                ? '✅ Tous les frais sont réglés'
                : `⚠️ Solde restant de ${formatAmount(balance.balance)}`}
            </p>
          </div>

          {/* Frais applicables */}
          <Card className="mb-6">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Frais applicables</h2>
            </div>
            {balance.fees.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm">Aucun frais configuré</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {balance.fees.map((fee: any) => {
                  const paid = balance.payments
                    .filter((p: any) => p.fee_id === fee.id)
                    .reduce((sum: number, p: any) => sum + Number(p.amount), 0);
                  const remaining = Number(fee.amount) - paid;
                  return (
                    <div key={fee.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {fee.fee_type_name}
                        </p>
                        {fee.due_date && (
                          <p className="text-xs text-gray-400">
                            Échéance : {new Date(fee.due_date).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">
                          {formatAmount(Number(fee.amount))}
                        </p>
                        {remaining > 0 ? (
                          <p className="text-xs text-red-500">
                            Reste : {formatAmount(remaining)}
                          </p>
                        ) : (
                          <p className="text-xs text-green-500">✓ Payé</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Historique paiements */}
          {balance.payments.length > 0 && (
            <Card>
              <div className="p-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Historique des paiements</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {balance.payments.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(p.payment_date).toLocaleDateString('fr-FR', {
                          day: 'numeric', month: 'long', year: 'numeric',
                        })}
                      </p>
                      <p className="text-xs text-gray-400">
                        {paymentMethodLabels[p.payment_method] || p.payment_method}
                        {p.reference ? ` · Réf: ${p.reference}` : ''}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-green-600">
                      {formatAmount(Number(p.amount))}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      ) : null}
    </div>
  );
}