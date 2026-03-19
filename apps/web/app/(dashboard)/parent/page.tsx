'use client';

import { useState, useEffect } from 'react';
import {
  Users, TrendingUp, Clock, Shield, FileText,
  Calendar, ChevronRight, Trophy, AlertTriangle,
} from 'lucide-react';
import { academicApi, academicYearApi } from '@/lib/academic-api';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function ParentDashboard() {
  const [parentData, setParentData] = useState<any>(null);
  const [academicYear, setAcademicYear] = useState<any>(null);
  const [childrenData, setChildrenData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [parentRes, yearRes] = await Promise.all([
          academicApi.get('/parents/me'),
          academicYearApi.getCurrent(),
        ]);
        const parent = parentRes.data.data;
        const year = yearRes.data.data;
        setParentData(parent);
        setAcademicYear(year);

        // Charger les données pour chaque enfant
        const kids = parent?.students || [];
        const dataMap: Record<string, any> = {};

        await Promise.all(kids.map(async (student: any) => {
          const [b1, b2, b3, annual, disc, att] = await Promise.allSettled([
            academicApi.get(`/bulletins/${student.id}/data?academic_year_id=${year.id}&trimester=1`),
            academicApi.get(`/bulletins/${student.id}/data?academic_year_id=${year.id}&trimester=2`),
            academicApi.get(`/bulletins/${student.id}/data?academic_year_id=${year.id}&trimester=3`),
            academicApi.get(`/bulletins/${student.id}/data-annual?academic_year_id=${year.id}`),
            academicApi.get(`/discipline/student/${student.id}?academic_year_id=${year.id}`),
            academicApi.get(`/attendances/stats?student_id=${student.id}&academic_year_id=${year.id}`),
          ]);

          dataMap[student.id] = {
            t1: b1.status === 'fulfilled' ? b1.value.data.data : null,
            t2: b2.status === 'fulfilled' ? b2.value.data.data : null,
            t3: b3.status === 'fulfilled' ? b3.value.data.data : null,
            annual: annual.status === 'fulfilled' ? annual.value.data.data : null,
            discipline: disc.status === 'fulfilled' ? (disc.value.data.data || []).filter((d: any) => !d.resolved) : [],
            attendance: att.status === 'fulfilled' ? att.value.data.data : null,
          };
        }));

        setChildrenData(dataMap);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const getMentionColor = (avg: number | null) => {
    if (!avg) return 'text-gray-400';
    if (avg >= 16) return 'text-emerald-600';
    if (avg >= 14) return 'text-green-600';
    if (avg >= 12) return 'text-blue-600';
    if (avg >= 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMentionBg = (avg: number | null) => {
    if (!avg) return 'bg-gray-50 border-gray-200';
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

  const fmt = (v: any) => v !== null && v !== undefined ? Number(v).toFixed(2) : '—';

  const getRankLabel = (ranking: any) => {
    if (!ranking?.rank) return '—';
    return `${ranking.rank}${ranking.rank === 1 ? 'er' : 'ème'}/${ranking.total}`;
  };

  const kids = parentData?.students || [];
  const totalDiscipline = kids.reduce((sum: number, k: any) => sum + (childrenData[k.id]?.discipline?.length || 0), 0);
  const totalAbsences = kids.reduce((sum: number, k: any) => sum + (childrenData[k.id]?.attendance?.total_absences || 0), 0);

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Bonjour, {parentData?.first_name} 👋
        </h1>
        <p className="text-gray-500 mt-1">{academicYear?.name} · Suivi de vos enfants</p>
      </div>

      {/* Stats globales */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <Users className="w-6 h-6 mx-auto mb-1 text-green-600" />
          <p className="text-2xl font-black text-gray-900">{kids.length}</p>
          <p className="text-xs text-gray-500 mt-1">Enfant{kids.length > 1 ? 's' : ''}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <TrendingUp className="w-6 h-6 mx-auto mb-1 text-blue-600" />
          <p className="text-2xl font-black text-gray-900">
            {kids.length > 0 && childrenData[kids[0]?.id]?.t1
              ? fmt(childrenData[kids[0].id].t1.generalAverage)
              : '—'}
          </p>
          <p className="text-xs text-gray-500 mt-1">Moy. T1 {kids[0]?.first_name}</p>
        </div>
        <div className={cn('rounded-xl border p-4 text-center', totalAbsences > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200')}>
          <Clock className={cn('w-6 h-6 mx-auto mb-1', totalAbsences > 0 ? 'text-red-500' : 'text-gray-400')} />
          <p className={cn('text-2xl font-black', totalAbsences > 0 ? 'text-red-600' : 'text-gray-900')}>{totalAbsences}</p>
          <p className="text-xs text-gray-500 mt-1">Absences totales</p>
        </div>
        <div className={cn('rounded-xl border p-4 text-center', totalDiscipline > 0 ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200')}>
          <Shield className={cn('w-6 h-6 mx-auto mb-1', totalDiscipline > 0 ? 'text-orange-500' : 'text-green-500')} />
          <p className={cn('text-2xl font-black', totalDiscipline > 0 ? 'text-orange-600' : 'text-green-600')}>{totalDiscipline || 'RAS'}</p>
          <p className="text-xs text-gray-500 mt-1">Sanctions en cours</p>
        </div>
      </div>

      {/* Fiche par enfant */}
      <div className="space-y-6">
        {kids.map((student: any) => {
          const d = childrenData[student.id] || {};
          return (
            <Card key={student.id} padding="none">
              {/* En-tête enfant */}
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold">
                    {student.first_name?.[0]}{student.last_name?.[0]}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{student.last_name} {student.first_name}</p>
                    <p className="text-xs text-gray-500">{student.class_name} · {student.student_code}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href="/parent/bulletins" className="text-xs text-green-600 hover:underline flex items-center gap-1">
                    <FileText className="w-3 h-3" />Bulletins
                  </Link>
                  <span className="text-gray-300">·</span>
                  <Link href="/parent/timetable" className="text-xs text-green-600 hover:underline flex items-center gap-1">
                    <Calendar className="w-3 h-3" />EDT
                  </Link>
                  <span className="text-gray-300">·</span>
                  <Link href="/parent/discipline" className="text-xs text-green-600 hover:underline flex items-center gap-1">
                    <Shield className="w-3 h-3" />Discipline
                  </Link>
                </div>
              </div>

              {/* Moyennes */}
              <div className="p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Moyennes</p>
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {[
                    { label: 'T1', avg: d.t1?.generalAverage, mention: d.t1?.mention, color: 'text-sky-600', bg: 'bg-sky-50 border-sky-100' },
                    { label: 'T2', avg: d.t2?.generalAverage, mention: d.t2?.mention, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100' },
                    { label: 'T3', avg: d.t3?.generalAverage, mention: d.t3?.mention, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100' },
                    { label: 'Annuelle', avg: d.annual?.avgAnnual, mention: d.annual?.mentionAnnual, color: getMentionColor(d.annual?.avgAnnual), bg: getMentionBg(d.annual?.avgAnnual) },
                  ].map((item) => (
                    <div key={item.label} className={cn('rounded-xl border p-3 text-center', item.bg)}>
                      <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                      <p className={cn('text-xl font-black', item.color)}>{fmt(item.avg)}</p>
                      {item.mention && <p className="text-xs text-gray-400 mt-0.5">{item.mention}</p>}
                    </div>
                  ))}
                </div>

                {/* Classement + Absences + Discipline */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-yellow-50 border border-yellow-100 p-3 flex items-center gap-3">
                    <Trophy className={cn('w-5 h-5 shrink-0', getRankColor(d.t1?.ranking?.rank))} />
                    <div>
                      <p className="text-xs text-gray-400">Classement T1</p>
                      <p className={cn('text-sm font-bold', getRankColor(d.t1?.ranking?.rank))}>
                        {getRankLabel(d.t1?.ranking)}
                      </p>
                    </div>
                  </div>
                  <div className={cn('rounded-xl border p-3 flex items-center gap-3', (d.attendance?.total_absences || 0) > 0 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100')}>
                    <Clock className={cn('w-5 h-5 shrink-0', (d.attendance?.total_absences || 0) > 0 ? 'text-red-500' : 'text-gray-400')} />
                    <div>
                      <p className="text-xs text-gray-400">Absences / Retards</p>
                      <p className={cn('text-sm font-bold', (d.attendance?.total_absences || 0) > 0 ? 'text-red-600' : 'text-gray-600')}>
                        {d.attendance?.total_absences || 0} / {d.attendance?.total_lates || 0}
                      </p>
                    </div>
                  </div>
                  <div className={cn('rounded-xl border p-3 flex items-center gap-3', d.discipline?.length > 0 ? 'bg-orange-50 border-orange-100' : 'bg-green-50 border-green-100')}>
                    {d.discipline?.length > 0
                      ? <AlertTriangle className="w-5 h-5 shrink-0 text-orange-500" />
                      : <Shield className="w-5 h-5 shrink-0 text-green-500" />
                    }
                    <div>
                      <p className="text-xs text-gray-400">Discipline</p>
                      <p className={cn('text-sm font-bold', d.discipline?.length > 0 ? 'text-orange-600' : 'text-green-600')}>
                        {d.discipline?.length > 0 ? `${d.discipline.length} en cours` : 'RAS'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Accès rapides */}
      <div className="mt-6 grid grid-cols-4 gap-3">
        {[
          { label: 'Emploi du temps', href: '/parent/timetable', icon: Calendar, color: 'text-blue-600 bg-blue-50 border-blue-200' },
          { label: 'Absences', href: '/parent/attendance', icon: Clock, color: 'text-red-600 bg-red-50 border-red-200' },
          { label: 'Bulletins', href: '/parent/bulletins', icon: FileText, color: 'text-green-600 bg-green-50 border-green-200' },
          { label: 'Discipline', href: '/parent/discipline', icon: Shield, color: 'text-orange-600 bg-orange-50 border-orange-200' },
        ].map((item) => {
          const Icon = item.icon;
          const [textColor, bgColor, borderColor] = item.color.split(' ');
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn('rounded-xl border p-4 flex items-center gap-3 hover:shadow-md transition-shadow cursor-pointer', bgColor, borderColor)}>
                <Icon className={cn('w-5 h-5', textColor)} />
                <span className={cn('text-sm font-medium', textColor)}>{item.label}</span>
                <ChevronRight className={cn('w-4 h-4 ml-auto', textColor)} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
