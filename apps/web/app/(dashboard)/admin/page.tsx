'use client';

import { useState, useEffect } from 'react';
import {
  Users, GraduationCap, BookOpen, ClipboardList,
  TrendingUp, AlertTriangle, DollarSign, Calendar,
  Shield, Clock, ChevronRight, CheckCircle,
} from 'lucide-react';
import { academicApi, academicYearApi } from '@/lib/academic-api';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const [academicYear, setAcademicYear] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [recentDiscipline, setRecentDiscipline] = useState<any[]>([]);
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const yearRes = await academicYearApi.getCurrent();
        const year = yearRes.data.data;
        setAcademicYear(year);

        const [
          studentsRes, teachersRes, classesRes, parentsRes,
          attendanceRes, financeRes, disciplineRes, gradesRes,
        ] = await Promise.allSettled([
          academicApi.get('/students'),
          academicApi.get('/teachers'),
          academicApi.get('/classes'),
          academicApi.get('/parents'),
          academicApi.get(`/attendance?academic_year_id=${year.id}&limit=5`),
          academicApi.get(`/finance/stats?academic_year_id=${year.id}`),
          academicApi.get(`/discipline/stats?academic_year_id=${year.id}`),
          academicApi.get(`/grades/stats?academic_year_id=${year.id}`),
        ]);

        const getValue = (res: any) => res.status === 'fulfilled' ? res.value.data.data : null;

        setStats({
          students: getValue(studentsRes)?.length || 0,
          teachers: getValue(teachersRes)?.length || 0,
          classes: getValue(classesRes)?.length || 0,
          parents: getValue(parentsRes)?.length || 0,
          finance: getValue(financeRes),
          discipline: getValue(disciplineRes),
          grades: getValue(gradesRes),
        });

        // Discipline récente
        const discRes = await academicApi.get(`/discipline?academic_year_id=${year.id}&resolved=false`);
        setRecentDiscipline((discRes.data.data || []).slice(0, 5));

        // Absences récentes
        try {
          const attRes = await academicApi.get(`/attendance?academic_year_id=${year.id}`);
          setRecentAttendance((attRes.data.data || []).slice(0, 5));
        } catch { /* silently ignore */ }

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full" />
    </div>
  );

  const statCards = [
    { label: 'Élèves', value: stats?.students || 0, icon: Users, color: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', href: '/admin/students' },
    { label: 'Enseignants', value: stats?.teachers || 0, icon: GraduationCap, color: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-700', href: '/admin/teachers' },
    { label: 'Classes', value: stats?.classes || 0, icon: BookOpen, color: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-700', href: '/admin/classes' },
    { label: 'Parents', value: stats?.parents || 0, icon: Users, color: 'bg-orange-500', bg: 'bg-orange-50', text: 'text-orange-700', href: '/admin/parents' },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500 mt-1">{academicYear?.name} · Bienvenue sur EduCore</p>
      </div>

      {/* Stats principales */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={card.href}>
              <div className={cn('rounded-xl p-5 border border-gray-200 bg-white hover:shadow-md transition-shadow cursor-pointer')}>
                <div className="flex items-center justify-between mb-3">
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', card.bg)}>
                    <Icon className={cn('w-5 h-5', card.text)} />
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
                <p className="text-3xl font-black text-gray-900">{card.value}</p>
                <p className="text-sm text-gray-500 mt-1">{card.label}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Ligne 2 : Finance + Discipline + Absences */}
      <div className="grid grid-cols-3 gap-4 mb-6">

        {/* Finance */}
        <Link href="/admin/finance">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="font-semibold text-gray-900 text-sm">Finance</p>
              </div>
              {stats?.finance ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Total attendu</span>
                    <span className="text-sm font-bold text-gray-900">
                      {(stats.finance.totalExpected || 0).toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Encaissé</span>
                    <span className="text-sm font-bold text-emerald-600">
                      {(stats.finance.totalPaid || 0).toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Reste à payer</span>
                    <span className="text-sm font-bold text-red-500">
                      {(stats.finance.totalPending || 0).toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                  {stats.finance.totalExpected > 0 && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Taux de recouvrement</span>
                        <span>{Math.round((stats.finance.totalPaid / stats.finance.totalExpected) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-emerald-500 h-2 rounded-full"
                          style={{ width: `${Math.min(100, Math.round((stats.finance.totalPaid / stats.finance.totalExpected) * 100))}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400">Aucune donnée</p>
              )}
            </div>
          </Card>
        </Link>

        {/* Discipline */}
        <Link href="/admin/discipline">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-red-600" />
                </div>
                <p className="font-semibold text-gray-900 text-sm">Discipline</p>
              </div>
              {stats?.discipline ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Total sanctions</span>
                    <span className="text-sm font-bold text-gray-900">{stats.discipline.total}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">En cours</span>
                    <span className="text-sm font-bold text-orange-600">{stats.discipline.pending}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Résolues</span>
                    <span className="text-sm font-bold text-green-600">{stats.discipline.resolved}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Avertissements</span>
                    <span className="text-sm font-bold text-yellow-600">{stats.discipline.byType?.avertissement || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Exclusions</span>
                    <span className="text-sm font-bold text-red-600">{stats.discipline.byType?.exclusion || 0}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">Aucune donnée</p>
              )}
            </div>
          </Card>
        </Link>

        {/* Activité récente */}
        <Card className="h-full">
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <p className="font-semibold text-gray-900 text-sm">Accès rapides</p>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Saisir des notes', href: '/admin/grades', icon: ClipboardList, color: 'text-blue-600 bg-blue-50' },
                { label: 'Gérer les absences', href: '/admin/attendance', icon: Clock, color: 'text-orange-600 bg-orange-50' },
                { label: 'Emploi du temps', href: '/admin/timetable', icon: Calendar, color: 'text-purple-600 bg-purple-50' },
                { label: 'Bulletins', href: '/admin/grades/reports', icon: TrendingUp, color: 'text-green-600 bg-green-50' },
                { label: 'Notifications', href: '/admin/notifications', icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', item.color.split(' ')[1])}>
                        <Icon className={cn('w-3.5 h-3.5', item.color.split(' ')[0])} />
                      </div>
                      <span className="text-sm text-gray-700">{item.label}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300 ml-auto" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* Sanctions en cours */}
      {recentDiscipline.length > 0 && (
        <Card padding="none" className="mb-6">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-red-500" />
              <h2 className="font-semibold text-gray-900 text-sm">Sanctions en cours</h2>
              <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-medium">
                {recentDiscipline.length}
              </span>
            </div>
            <Link href="/admin/discipline" className="text-xs text-blue-600 hover:underline">Voir tout</Link>
          </div>
          <table className="w-full">
            <tbody className="divide-y divide-gray-50">
              {recentDiscipline.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <p className="text-sm font-medium text-gray-900">
                      {record.student_last_name} {record.student_first_name}
                    </p>
                    <p className="text-xs text-gray-400">{record.class_name}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full border border-orange-200 capitalize">
                      {record.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 max-w-48 truncate">{record.reason}</td>
                  <td className="py-3 px-4 text-xs text-gray-400">
                    {new Date(record.date).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
