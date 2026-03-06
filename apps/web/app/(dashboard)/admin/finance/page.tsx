'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  DollarSign, TrendingUp, TrendingDown, Users,
  ChevronRight, CreditCard,
} from 'lucide-react';
import { academicApi, academicYearApi } from '@/lib/academic-api';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export default function FinanceDashboard() {
  const router = useRouter();
  const [academicYear, setAcademicYear] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    academicYearApi.getCurrent().then((res) => {
      setAcademicYear(res.data.data);
    });
  }, []);

  useEffect(() => {
    if (!academicYear) return;
    Promise.all([
      academicApi.get(`/finance/stats?academic_year_id=${academicYear.id}`),
      academicApi.get(`/finance/payments?academic_year_id=${academicYear.id}`),
    ]).then(([statsRes, paymentsRes]) => {
      setStats(statsRes.data.data);
      setRecentPayments((paymentsRes.data.data || []).slice(0, 10));
    }).catch(console.error)
      .finally(() => setIsLoading(false));
  }, [academicYear]);

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const collectRate = stats?.total_expected > 0
    ? Math.round((stats.total_collected / stats.total_expected) * 100)
    : 0;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance</h1>
          <p className="text-gray-500 mt-1">{academicYear?.name}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/admin/finance/fees')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Gérer les frais
          </button>
          <button
            onClick={() => router.push('/admin/finance/payments')}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Enregistrer un paiement
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card padding="sm">
          <div className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">
                Total attendu
              </p>
              <p className="text-lg font-bold text-gray-900">
                {formatAmount(stats?.total_expected || 0)}
              </p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">
                Collecté
              </p>
              <p className="text-lg font-bold text-green-600">
                {formatAmount(stats?.total_collected || 0)}
              </p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">
                Restant
              </p>
              <p className="text-lg font-bold text-red-500">
                {formatAmount(stats?.total_remaining || 0)}
              </p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500 uppercase font-medium">
                Taux de collecte
              </p>
              <p className="text-lg font-bold text-gray-900">{collectRate}%</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={cn(
                  'h-2 rounded-full transition-all',
                  collectRate >= 80 ? 'bg-green-500' :
                  collectRate >= 50 ? 'bg-orange-500' : 'bg-red-500',
                )}
                style={{ width: `${collectRate}%` }}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Paiements récents */}
      <Card>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Paiements récents</h2>
          <button
            onClick={() => router.push('/admin/finance/payments')}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            Voir tout <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        {recentPayments.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Aucun paiement enregistré</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase">
                  Élève
                </th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase">
                  Type de frais
                </th>
                <th className="text-center py-3 px-6 text-xs font-semibold text-gray-500 uppercase">
                  Méthode
                </th>
                <th className="text-center py-3 px-6 text-xs font-semibold text-gray-500 uppercase">
                  Date
                </th>
                <th className="text-right py-3 px-6 text-xs font-semibold text-gray-500 uppercase">
                  Montant
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentPayments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-6">
                    <p className="text-sm font-medium text-gray-900">
                      {p.student_last_name} {p.student_first_name}
                    </p>
                    <p className="text-xs text-gray-400">{p.student_code}</p>
                  </td>
                  <td className="py-3 px-6">
                    <p className="text-sm text-gray-600">{p.fee_type_name}</p>
                    {p.class_name && (
                      <p className="text-xs text-gray-400">{p.class_name}</p>
                    )}
                  </td>
                  <td className="py-3 px-6 text-center">
                    <span className={cn(
                      'text-xs px-2 py-1 rounded-full font-medium',
                      paymentMethodColors[p.payment_method] || 'bg-gray-100 text-gray-600',
                    )}>
                      {paymentMethodLabels[p.payment_method] || p.payment_method}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-center">
                    <p className="text-sm text-gray-600">
                      {new Date(p.payment_date).toLocaleDateString('fr-FR')}
                    </p>
                  </td>
                  <td className="py-3 px-6 text-right">
                    <p className="text-sm font-bold text-green-600">
                      {formatAmount(Number(p.amount))}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}