'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, ChevronRight, TrendingUp } from 'lucide-react';
import { academicApi, academicYearApi, gradeApi } from '@/lib/academic-api';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export default function ParentChildrenPage() {
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
    }).finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!parentData?.students || !academicYear) return;
    parentData.students.forEach(async (student: any) => {
      try {
        const res = await gradeApi.getStudentAverage(student.id, {
          term: 1,
          academic_year_id: academicYear.id,
        });
        setChildrenAverages((prev) => ({ ...prev, [student.id]: res.data.data }));
      } catch {
        console.error('Erreur moyenne');
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
        <h1 className="text-2xl font-bold text-gray-900">Mes enfants</h1>
        <p className="text-gray-500 mt-1">
          Suivez les résultats de vos enfants
        </p>
      </div>

      {!parentData?.students?.length ? (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucun enfant lié</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {parentData.students.map((student: any) => {
            const avgData = childrenAverages[student.id];
            const mention = getMention(avgData?.average || null);
            return (
              <Card
                key={student.id}
                padding="sm"
                className="cursor-pointer hover:shadow-md transition-shadow"
              >
                <div
                  className="flex items-center justify-between p-6"
                  onClick={() => router.push(`/parent/child/${student.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xl">
                      {student.first_name[0]}{student.last_name[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-lg">
                        {student.last_name} {student.first_name}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {student.class_name} · {student.student_code}
                      </p>
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded-full mt-1 inline-block',
                        student.enrollment_status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500',
                      )}>
                        {student.enrollment_status === 'active' ? 'Inscrit' : 'Inactif'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <TrendingUp className="w-4 h-4 text-gray-400" />
                        <p className={cn('text-2xl font-bold', mention.color)}>
                          {avgData?.average ? `${avgData.average}/20` : '—'}
                        </p>
                      </div>
                      <p className={cn('text-xs mt-0.5', mention.color)}>
                        {mention.label}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}