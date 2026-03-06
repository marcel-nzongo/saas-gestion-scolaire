'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, TrendingUp, BookOpen, ChevronRight } from 'lucide-react';
import { academicApi, academicYearApi, gradeApi } from '@/lib/academic-api';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export default function ParentDashboard() {
  const router = useRouter();
  const [parentData, setParentData] = useState<any>(null);
  const [academicYear, setAcademicYear] = useState<any>(null);
  const [childrenAverages, setChildrenAverages] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      academicApi.get('/parents/me'),
      academicYearApi.getCurrent(),
    ]).then(([parentRes, yearRes]) => {
      setParentData(parentRes.data.data);
      setAcademicYear(yearRes.data.data);
    }).catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!parentData?.students || !academicYear) return;
    parentData.students.forEach(async (student: any) => {
      try {
        const res = await gradeApi.getStudentAverage(student.id, {
          term: 1,
          academic_year_id: academicYear.id,
        });
        setChildrenAverages((prev) => ({
          ...prev,
          [student.id]: res.data.data,
        }));
      } catch {
        console.error('Erreur moyenne élève');
      }
    });
  }, [parentData, academicYear]);

  const getMention = (avg: number | null) => {
    if (avg === null) return { label: '—', color: 'text-gray-400' };
    if (avg >= 16) return { label: 'Très Bien', color: 'text-green-600' };
    if (avg >= 14) return { label: 'Bien', color: 'text-blue-600' };
    if (avg >= 10) return { label: 'Passable', color: 'text-orange-500' };
    return { label: 'Insuffisant', color: 'text-red-600' };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Bonjour, {parentData?.first_name} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          {academicYear?.name} — Suivi de vos enfants
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <Card padding="sm">
          <div className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Enfants</p>
              <p className="text-3xl font-bold text-gray-900">
                {parentData?.students?.length || 0}
              </p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">
                Moyenne générale
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {Object.values(childrenAverages).length > 0
                  ? (
                      Object.values(childrenAverages)
                        .filter((a: any) => a?.average)
                        .reduce((sum: number, a: any) => sum + a.average, 0) /
                      Object.values(childrenAverages).filter((a: any) => a?.average).length
                    ).toFixed(1)
                  : '—'}
              </p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">
                Trimestre actuel
              </p>
              <p className="text-3xl font-bold text-gray-900">T1</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Liste enfants */}
      <Card>
        <div className="p-6 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Mes enfants</h2>
        </div>
        {!parentData?.students?.length ? (
          <div className="text-center py-12">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Aucun enfant lié</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {parentData.students.map((student: any) => {
              const avgData = childrenAverages[student.id];
              const mention = getMention(avgData?.average || null);
              return (
                <div
                  key={student.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/parent/child/${student.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
                      {student.first_name[0]}{student.last_name[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {student.last_name} {student.first_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {student.class_name} · {student.student_code}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={cn('text-lg font-bold', mention.color)}>
                        {avgData?.average ? `${avgData.average}/20` : '—'}
                      </p>
                      <p className={cn('text-xs', mention.color)}>
                        {mention.label}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}