'use client';

import { useState, useEffect } from 'react';
import { XCircle, Clock, CheckCircle } from 'lucide-react';
import { academicApi, academicYearApi } from '@/lib/academic-api';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export default function ParentAttendancePage() {
  const [parentData, setParentData] = useState<any>(null);
  const [academicYear, setAcademicYear] = useState<any>(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [attendances, setAttendances] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedType, setSelectedType] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      academicApi.get('/parents/me'),
      academicYearApi.getCurrent(),
    ]).then(([parentRes, yearRes]) => {
      setParentData(parentRes.data.data);
      setAcademicYear(yearRes.data.data);
    });
  }, []);

  useEffect(() => {
    if (!selectedStudentId || !academicYear) return;
    loadData();
  }, [selectedStudentId, academicYear, selectedType]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        student_id: selectedStudentId,
        academic_year_id: academicYear.id,
        ...(selectedType && { type: selectedType }),
      });
      const [attendanceRes, statsRes] = await Promise.all([
        academicApi.get(`/attendances?${params}`),
        academicApi.get(`/attendances/stats?student_id=${selectedStudentId}&academic_year_id=${academicYear.id}`),
      ]);
      setAttendances(attendanceRes.data.data || []);
      setStats(statsRes.data.data);
    } catch {
      console.error('Erreur');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Absences & Retards</h1>
        <p className="text-gray-500 mt-1">Suivi des absences de vos enfants</p>
      </div>

      {/* Sélection enfant */}
      <Card className="mb-6">
        <div className="flex gap-4 p-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Enfant *
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Sélectionner un enfant</option>
              {parentData?.students?.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.last_name} {s.first_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Tous</option>
              <option value="absence">Absences</option>
              <option value="late">Retards</option>
            </select>
          </div>
        </div>
      </Card>

      {!selectedStudentId ? (
        <div className="text-center py-16">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            Sélectionnez un enfant pour voir ses absences
          </p>
        </div>
      ) : (
        <>
          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card padding="sm">
                <div className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Absences</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.total_absences}
                    </p>
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
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.justified_absences}
                    </p>
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
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.total_lates}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Liste */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
            </div>
          ) : attendances.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">
                Aucune absence ou retard enregistré
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {attendances.map((a) => (
                <Card key={a.id} padding="sm">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center',
                        a.type === 'absence' ? 'bg-red-50' : 'bg-orange-50',
                      )}>
                        {a.type === 'absence'
                          ? <XCircle className="w-5 h-5 text-red-500" />
                          : <Clock className="w-5 h-5 text-orange-500" />
                        }
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'text-xs px-2 py-0.5 rounded-full font-medium',
                            a.type === 'absence'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-orange-100 text-orange-700',
                          )}>
                            {a.type === 'absence' ? 'Absence' : 'Retard'}
                          </span>
                          {a.type === 'absence' && (
                            <span className={cn(
                              'text-xs px-2 py-0.5 rounded-full font-medium',
                              a.is_justified
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-500',
                            )}>
                              {a.is_justified ? 'Justifiée' : 'Non justifiée'}
                            </span>
                          )}
                          {a.type === 'late' && a.duration_minutes && (
                            <span className="text-xs text-gray-500">
                              {a.duration_minutes} min
                            </span>
                          )}
                        </div>
                        {a.reason && (
                          <p className="text-sm text-gray-500 mt-0.5">{a.reason}</p>
                        )}
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-600">
                      {new Date(a.date).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}