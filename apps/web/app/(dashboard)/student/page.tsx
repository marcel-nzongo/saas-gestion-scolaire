'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ClipboardList, TrendingUp, Award, BookOpen,
  Clock, FileText, Calendar, Shield, Trophy, ChevronRight,
} from 'lucide-react';
import { academicApi, academicYearApi } from '@/lib/academic-api';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function StudentDashboard() {
  const router = useRouter();
  const [studentData, setStudentData] = useState<any>(null);
  const [academicYear, setAcademicYear] = useState<any>(null);
  const [bulletinT1, setBulletinT1] = useState<any>(null);
  const [bulletinT2, setBulletinT2] = useState<any>(null);
  const [bulletinT3, setBulletinT3] = useState<any>(null);
  const [annualData, setAnnualData] = useState<any>(null);
  const [todaySlots, setTodaySlots] = useState<any[]>([]);
  const [discipline, setDiscipline] = useState<any[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [studentRes, yearRes] = await Promise.all([
          academicApi.get('/students/me'),
          academicYearApi.getCurrent(),
        ]);
        const student = studentRes.data.data;
        const year = yearRes.data.data;
        setStudentData(student);
        setAcademicYear(year);

        const [b1, b2, b3, annual, timetable, disc, att] = await Promise.allSettled([
          academicApi.get(`/bulletins/${student.id}/data?academic_year_id=${year.id}&trimester=1`),
          academicApi.get(`/bulletins/${student.id}/data?academic_year_id=${year.id}&trimester=2`),
          academicApi.get(`/bulletins/${student.id}/data?academic_year_id=${year.id}&trimester=3`),
          academicApi.get(`/bulletins/${student.id}/data-annual?academic_year_id=${year.id}`),
          academicApi.get(`/timetable/class/${student.class_id}?academic_year_id=${year.id}`),
          academicApi.get(`/discipline/student/${student.id}?academic_year_id=${year.id}`),
          academicApi.get(`/attendances/stats?student_id=${student.id}&academic_year_id=${year.id}`),
        ]);

        if (b1.status === 'fulfilled') setBulletinT1(b1.value.data.data);
        if (b2.status === 'fulfilled') setBulletinT2(b2.value.data.data);
        if (b3.status === 'fulfilled') setBulletinT3(b3.value.data.data);
        if (annual.status === 'fulfilled') setAnnualData(annual.value.data.data);
        if (att.status === 'fulfilled') setAttendanceStats(att.value.data.data);

        if (timetable.status === 'fulfilled') {
          const today = new Date().getDay();
          const slots = (timetable.value.data.data || []).filter((s: any) => s.day_of_week === today);
          setTodaySlots(slots.sort((a: any, b: any) => a.start_time.localeCompare(b.start_time)));
        }

        if (disc.status === 'fulfilled') {
          setDiscipline((disc.value.data.data || []).filter((d: any) => !d.resolved));
        }

      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const getMentionColor = (avg: number | null) => {
    if (avg === null || avg === undefined) return 'text-gray-400';
    if (avg >= 16) return 'text-emerald-600';
    if (avg >= 14) return 'text-green-600';
    if (avg >= 12) return 'text-blue-600';
    if (avg >= 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMentionBg = (avg: number | null) => {
    if (avg === null || avg === undefined) return 'bg-gray-50 border-gray-200';
    if (avg >= 14) return 'bg-green-50 border-green-200';
    if (avg >= 10) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getRankColor = (rank: number | null) => {
    if (!rank) return 'text-gray-400';
    if (rank === 1) return 'text-yellow-500';
    if (rank <= 3) return 'text-green-600';
    return 'text-blue-600';
  };

  const fmt = (v: number | null | undefined) =>
    v !== null && v !== undefined ? Number(v).toFixed(2) : '—';

  const getRankLabel = (ranking: any) => {
    if (!ranking?.rank) return '—';
    const suffix = ranking.rank === 1 ? 'er' : 'ème';
    return `${ranking.rank}${suffix}/${ranking.total}`;
  };

  const SLOT_COLORS = [
    'bg-blue-50 border-blue-200 text-blue-800',
    'bg-purple-50 border-purple-200 text-purple-800',
    'bg-green-50 border-green-200 text-green-800',
    'bg-orange-50 border-orange-200 text-orange-800',
  ];

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
    </div>
  );

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

      {/* Moyennes T1 / T2 / T3 + Annuelle */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Moyenne T1', avg: bulletinT1?.generalAverage, mention: bulletinT1?.mention, color: 'text-sky-600', bg: 'bg-sky-50 border-sky-200' },
          { label: 'Moyenne T2', avg: bulletinT2?.generalAverage, mention: bulletinT2?.mention, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
          { label: 'Moyenne T3', avg: bulletinT3?.generalAverage, mention: bulletinT3?.mention, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
          { label: 'Moyenne Annuelle', avg: annualData?.avgAnnual, mention: annualData?.mentionAnnual, color: getMentionColor(annualData?.avgAnnual), bg: getMentionBg(annualData?.avgAnnual) },
        ].map((item, i) => (
          <div key={i} className={cn('rounded-xl border p-4 text-center', item.bg)}>
            <p className="text-xs text-gray-500 font-medium mb-1">{item.label}</p>
            <p className={cn('text-3xl font-black', item.color)}>{fmt(item.avg)}</p>
            {item.mention && <p className="text-xs text-gray-400 mt-1">{item.mention}</p>}
          </div>
        ))}
      </div>

      {/* Classement + Absences + Retards + Discipline */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-yellow-50 border-yellow-200 p-4 text-center">
          <Trophy className={cn('w-6 h-6 mx-auto mb-1', getRankColor(bulletinT1?.ranking?.rank))} />
          <p className="text-xs text-gray-500 font-medium mb-1">Classement T1</p>
          <p className={cn('text-xl font-black', getRankColor(bulletinT1?.ranking?.rank))}>
            {getRankLabel(bulletinT1?.ranking)}
          </p>
          <p className="text-xs text-gray-400">dans la classe</p>
        </div>
        <div className="rounded-xl border bg-red-50 border-red-200 p-4 text-center">
          <Clock className="w-6 h-6 mx-auto mb-1 text-red-500" />
          <p className="text-xs text-gray-500 font-medium mb-1">Absences</p>
          <p className="text-xl font-black text-red-600">{attendanceStats?.total_absences || 0}</p>
          <p className="text-xs text-gray-400">cette année</p>
        </div>
        <div className="rounded-xl border bg-orange-50 border-orange-200 p-4 text-center">
          <Clock className="w-6 h-6 mx-auto mb-1 text-orange-500" />
          <p className="text-xs text-gray-500 font-medium mb-1">Retards</p>
          <p className="text-xl font-black text-orange-600">{attendanceStats?.total_lates || 0}</p>
          <p className="text-xs text-gray-400">cette année</p>
        </div>
        <div className={cn('rounded-xl border p-4 text-center', discipline.length > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200')}>
          <Shield className={cn('w-6 h-6 mx-auto mb-1', discipline.length > 0 ? 'text-red-500' : 'text-green-500')} />
          <p className="text-xs text-gray-500 font-medium mb-1">Discipline</p>
          <p className={cn('text-xl font-black', discipline.length > 0 ? 'text-red-600' : 'text-green-600')}>
            {discipline.length > 0 ? `${discipline.length} en cours` : 'RAS'}
          </p>
          <p className="text-xs text-gray-400">{discipline.length > 0 ? 'à régulariser' : 'Bonne conduite'}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Cours du jour */}
        <div className="col-span-2">
          <Card padding="none">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-600" />
                <h2 className="font-semibold text-gray-900 text-sm">Cours aujourd'hui</h2>
              </div>
              <Link href="/student/timetable" className="text-xs text-purple-600 hover:underline">Voir tout</Link>
            </div>
            {todaySlots.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm">Aucun cours aujourd'hui 🎉</p>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {todaySlots.map((slot, i) => (
                  <div key={slot.id} className={cn('rounded-lg border p-3 flex items-center gap-3', SLOT_COLORS[i % SLOT_COLORS.length])}>
                    <div className="text-xs font-medium opacity-70 w-20 shrink-0">
                      {slot.start_time?.substring(0, 5)} – {slot.end_time?.substring(0, 5)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{slot.subject_name}</p>
                      {slot.teacher_last_name && <p className="text-xs opacity-60">{slot.teacher_last_name}</p>}
                    </div>
                    {slot.room && <p className="text-xs opacity-60">🏫 {slot.room}</p>}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Accès rapides */}
        <div>
          <Card padding="none">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 text-sm">Accès rapides</h2>
            </div>
            <div className="p-2">
              {[
                { label: 'Mes notes', href: '/student/grades', icon: ClipboardList, color: 'text-purple-600 bg-purple-50' },
                { label: 'Mes bulletins', href: '/student/bulletins', icon: FileText, color: 'text-green-600 bg-green-50' },
                { label: 'Emploi du temps', href: '/student/timetable', icon: Calendar, color: 'text-blue-600 bg-blue-50' },
                { label: 'Absences', href: '/student/attendance', icon: Clock, color: 'text-red-600 bg-red-50' },
                { label: 'Discipline', href: '/student/discipline', icon: Shield, color: 'text-orange-600 bg-orange-50' },
                { label: 'Ressources', href: '/student/resources', icon: BookOpen, color: 'text-teal-600 bg-teal-50' },
              ].map((item) => {
                const Icon = item.icon;
                const [textColor, bgColor] = item.color.split(' ');
                return (
                  <Link key={item.href} href={item.href}>
                    <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', bgColor)}>
                        <Icon className={cn('w-3.5 h-3.5', textColor)} />
                      </div>
                      <span className="text-sm text-gray-700 flex-1">{item.label}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
