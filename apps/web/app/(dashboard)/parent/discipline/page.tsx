'use client';

import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, XCircle, Clock, Eye, CheckCircle } from 'lucide-react';
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

export default function ParentDisciplinePage() {
  const [academicYear, setAcademicYear] = useState<any>(null);
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [yearRes, parentRes] = await Promise.all([
          academicYearApi.getCurrent(),
          academicApi.get('/parents/me'),
        ]);
        const year = yearRes.data.data;
        const kids = parentRes.data.data?.students || [];
        setAcademicYear(year);
        setChildren(kids);
        if (kids.length > 0) setSelectedChild(kids[0]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedChild || !academicYear) return;
    setLoading(true);
    academicApi.get(`/discipline/student/${selectedChild.id}?academic_year_id=${academicYear.id}`)
      .then((res) => setRecords(res.data.data || []))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [selectedChild, academicYear]);

  const pending = records.filter(r => !r.resolved).length;
  const resolved = records.filter(r => r.resolved).length;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Discipline</h1>
        <p className="text-gray-500 mt-1">{academicYear?.name}</p>
      </div>

      {/* Sélection enfant */}
      {children.length > 1 && (
        <Card className="mb-6">
          <div className="p-4 flex gap-3 flex-wrap">
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => setSelectedChild(child)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border',
                  selectedChild?.id === child.id
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-green-400',
                )}
              >
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold">
                  {child.first_name?.[0]}
                </div>
                {child.first_name} {child.last_name}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Stats */}
      {selectedChild && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-black text-gray-900">{records.length}</p>
            <p className="text-xs text-gray-500 mt-1">Total sanctions</p>
          </div>
          <div className="bg-orange-50 rounded-xl border border-orange-200 p-4 text-center">
            <p className="text-2xl font-black text-orange-600">{pending}</p>
            <p className="text-xs text-gray-500 mt-1">En cours</p>
          </div>
          <div className="bg-green-50 rounded-xl border border-green-200 p-4 text-center">
            <p className="text-2xl font-black text-green-600">{resolved}</p>
            <p className="text-xs text-gray-500 mt-1">Résolues</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucune sanction enregistrée</p>
          <p className="text-gray-400 text-sm mt-1">Bonne conduite ! 🎉</p>
        </div>
      ) : (
        <Card padding="none">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Motif</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {records.map((record) => {
                const meta = getTypeMeta(record.type);
                const Icon = meta.icon;
                return (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border', meta.color)}>
                        <Icon className="w-3 h-3" />
                        {meta.label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-gray-900">{record.reason}</p>
                      {record.description && <p className="text-xs text-gray-400 mt-0.5">{record.description}</p>}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {new Date(record.date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-3 px-4">
                      {record.resolved ? (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-300">
                            <CheckCircle className="w-3 h-3" />Résolu
                          </span>
                          {record.resolution_notes && (
                            <p className="text-xs text-gray-400 mt-1 italic">{record.resolution_notes}</p>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-300">
                          <Clock className="w-3 h-3" />En cours
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
