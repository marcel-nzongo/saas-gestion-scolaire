'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardList, TrendingUp, Award, BookOpen, Clock } from 'lucide-react';
import { academicApi, academicYearApi, gradeApi } from '@/lib/academic-api';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export default function StudentDashboard() {
  const router = useRouter();
  const [studentData, setStudentData] = useState<any>(null);
  const [academicYear, setAcademicYear] = useState<any>(null);
  const [averages, setAverages] = useState<any>(null);
  const [attendanceStats, setAttendanceStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      academicApi.get('/students/me'),
      academicYearApi.getCurrent(),
    ]).then(([studentRes, yearRes]) => {
      setStudentData(studentRes.data.data);
      setAcademicYear(yearRes.data.data);
    }).catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!studentData || !academicYear) return;
    Promise.all([
      gradeApi.getStudentAverage(studentData.id, {
        term: 1,
        academic_year_id: academicYear.id,
      }),
      academicApi.get(`/attendances/stats?student_id=${studentData.id}&academic_year_id=${academicYear.id}`),
    ]).then(([avgRes, statsRes]) => {
      setAverages(avgRes.data.data);
      setAttendanceStats(statsRes.data.data);
    }).catch(console.error);
  }, [studentData, academicYear]);

  const getMention = (avg: number | null) => {
    if (avg === null) return { label: '—', color: 'text-gray-400' };
    if (avg >= 18) return { label: 'Excellent', color: 'text-green-600' };
    if (avg >= 16) return { label: 'Très Bien', color: 'text-green-500' };
    if (avg >= 14) return { label: 'Bien', color: 'text-blue-600' };
    if (avg >= 12) return { label: 'Assez Bien', color: 'text-blue-500' };
    if (avg >= 10) return { label: 'Passable', color: 'text-orange-500' };
    return { label: 'Insuffisant', color: 'text-red-600' };
  };

  const mention = getMention(averages?.average || null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Bonjour, {studentData?.first_name} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          {academicYear?.name} · {studentData?.class_name}
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card padding="sm">
          <div className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Moyenne T1</p>
              <p className={cn('text-2xl font-bold', mention.color)}>
                {averages?.average ? `${averages.average}` : '—'}
              </p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <Award className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Mention</p>
              <p className={cn('text-lg font-bold', mention.color)}>
                {mention.label}
              </p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Absences</p>
              <p className="text-2xl font-bold text-gray-900">
                {attendanceStats?.total_absences || 0}
              </p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Retards</p>
              <p className="text-2xl font-bold text-gray-900">
                {attendanceStats?.total_lates || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Accès rapides */}
      <div className="grid grid-cols-2 gap-4">
        <Card padding="sm" className="cursor-pointer hover:shadow-md transition-shadow">
          <div
            className="flex items-center gap-4 p-6"
            onClick={() => router.push('/student/grades')}
          >
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Mes notes</p>
              <p className="text-sm text-gray-500 mt-0.5">
                Voir toutes mes notes par matière
              </p>
            </div>
          </div>
        </Card>
        <Card padding="sm" className="cursor-pointer hover:shadow-md transition-shadow">
          <div
            className="flex items-center gap-4 p-6"
            onClick={() => router.push('/student/attendance')}
          >
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Absences & Retards</p>
              <p className="text-sm text-gray-500 mt-0.5">
                Consulter mon historique
              </p>
            </div>
          </div>
        </Card>
        <Card padding="sm" className="cursor-pointer hover:shadow-md transition-shadow">
          <div
            className="flex items-center gap-4 p-6"
            onClick={() => router.push('/student/resources')}
          >
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Ressources</p>
              <p className="text-sm text-gray-500 mt-0.5">
                Cours et documents
              </p>
            </div>
          </div>
        </Card>
        <Card padding="sm" className="cursor-pointer hover:shadow-md transition-shadow">
          <div
            className="flex items-center gap-4 p-6"
            onClick={() => router.push('/student/forum')}
          >
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Forum</p>
              <p className="text-sm text-gray-500 mt-0.5">
                Discussions avec les enseignants
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}