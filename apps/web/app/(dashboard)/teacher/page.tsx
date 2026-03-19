'use client';

import { useState, useEffect } from 'react';
import {
  BookOpen, Users, ClipboardList, TrendingUp,
  Calendar, Clock, ChevronRight, CheckCircle,
} from 'lucide-react';
import { academicApi, academicYearApi } from '@/lib/academic-api';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function TeacherDashboard() {
  const [teacherData, setTeacherData] = useState<any>(null);
  const [academicYear, setAcademicYear] = useState<any>(null);
  const [todaySlots, setTodaySlots] = useState<any[]>([]);
  const [myStudents, setMyStudents] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [teacherRes, yearRes] = await Promise.all([
          academicApi.get('/teachers/me'),
          academicYearApi.getCurrent(),
        ]);
        const teacher = teacherRes.data.data;
        const year = yearRes.data.data;
        setTeacherData(teacher);
        setAcademicYear(year);

        const assignments = teacher?.assignments || [];
        const classIds = new Set(assignments.map((a: any) => a.class_id));

        const [timetableRes, studentsRes] = await Promise.allSettled([
          academicApi.get(`/timetable/teacher/${teacher.id}?academic_year_id=${year.id}`),
          academicApi.get('/students'),
        ]);

        if (timetableRes.status === 'fulfilled') {
          const today = new Date().getDay();
          const slots = (timetableRes.value.data.data || [])
            .filter((s: any) => s.day_of_week === today)
            .sort((a: any, b: any) => a.start_time.localeCompare(b.start_time));
          setTodaySlots(slots);
        }

        if (studentsRes.status === 'fulfilled') {
          const all = studentsRes.value.data.data || [];
          setMyStudents(all.filter((s: any) => classIds.has(s.class_id)).length);
        }

      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
    </div>
  );

  const assignments = teacherData?.assignments || [];
  const uniqueClasses = [...new Map(assignments.map((a: any) => [a.class_id, a])).values()];
  const uniqueSubjects = [...new Map(assignments.map((a: any) => [a.subject_id, a])).values()];

  const SLOT_COLORS = [
    'bg-blue-50 border-blue-200 text-blue-800',
    'bg-purple-50 border-purple-200 text-purple-800',
    'bg-green-50 border-green-200 text-green-800',
    'bg-orange-50 border-orange-200 text-orange-800',
  ];

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const nextSlot = todaySlots.find(s => s.start_time?.substring(0, 5) >= currentTime);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Bonjour, {teacherData?.first_name} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          {academicYear?.name} · {teacherData?.speciality || 'Enseignant'}
        </p>
      </div>

      {/* 4 stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <BookOpen className="w-6 h-6 mx-auto mb-1 text-blue-600" />
          <p className="text-2xl font-black text-blue-700">{uniqueClasses.length}</p>
          <p className="text-xs text-gray-500 mt-1">Classe{uniqueClasses.length > 1 ? 's' : ''}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <ClipboardList className="w-6 h-6 mx-auto mb-1 text-green-600" />
          <p className="text-2xl font-black text-green-700">{uniqueSubjects.length}</p>
          <p className="text-xs text-gray-500 mt-1">Matière{uniqueSubjects.length > 1 ? 's' : ''}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
          <Users className="w-6 h-6 mx-auto mb-1 text-purple-600" />
          <p className="text-2xl font-black text-purple-700">{myStudents}</p>
          <p className="text-xs text-gray-500 mt-1">Élèves</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
          <Calendar className="w-6 h-6 mx-auto mb-1 text-orange-600" />
          <p className="text-2xl font-black text-orange-700">{todaySlots.length}</p>
          <p className="text-xs text-gray-500 mt-1">Cours aujourd'hui</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Colonne gauche : cours du jour + classes */}
        <div className="col-span-2 space-y-6">

          {/* Cours du jour */}
          <Card padding="none">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <h2 className="font-semibold text-gray-900 text-sm">Cours aujourd'hui</h2>
              </div>
              <Link href="/teacher/timetable" className="text-xs text-blue-600 hover:underline">
                Voir tout
              </Link>
            </div>
            {todaySlots.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-8 h-8 text-green-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Aucun cours aujourd'hui 🎉</p>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {todaySlots.map((slot, i) => (
                  <div
                    key={slot.id}
                    className={cn('rounded-lg border p-3 flex items-center gap-3', SLOT_COLORS[i % SLOT_COLORS.length])}
                  >
                    <div className="text-xs font-medium opacity-70 w-20 shrink-0">
                      {slot.start_time?.substring(0, 5)} – {slot.end_time?.substring(0, 5)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{slot.subject_name}</p>
                      <p className="text-xs opacity-60">📚 {slot.class_name}</p>
                    </div>
                    {slot.room && <p className="text-xs opacity-60">🏫 {slot.room}</p>}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Classes et matières */}
          <Card padding="none">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 text-sm">Mes classes et matières</h2>
            </div>
            {assignments.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Aucune assignation</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {assignments.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: a.subject_color || '#6366f1' }}
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{a.subject_name}</p>
                        <p className="text-xs text-gray-500">
                          {a.class_name}
                          {a.is_main_teacher && (
                            <span className="ml-2 text-blue-600 font-medium">· Prof. principal</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium">
                      {a.class_name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Colonne droite : accès rapides + prochain cours */}
        <div className="space-y-4">
          <Card padding="none">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 text-sm">Accès rapides</h2>
            </div>
            <div className="p-2">
              {[
                { label: 'Mes classes', href: '/teacher/classes', icon: BookOpen, color: 'text-blue-600 bg-blue-50' },
                { label: 'Saisir des notes', href: '/teacher/grades', icon: ClipboardList, color: 'text-green-600 bg-green-50' },
                { label: 'Emploi du temps', href: '/teacher/timetable', icon: Calendar, color: 'text-purple-600 bg-purple-50' },
                { label: 'Bulletins', href: '/teacher/reports', icon: TrendingUp, color: 'text-orange-600 bg-orange-50' },
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

          {/* Prochain cours */}
          <Card padding="none">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 text-sm">Prochain cours</h2>
            </div>
            <div className="p-4">
              {nextSlot ? (
                <div className="space-y-2">
                  <p className="text-sm font-bold text-gray-900">{nextSlot.subject_name}</p>
                  <p className="text-xs text-gray-500">📚 {nextSlot.class_name}</p>
                  <p className="text-xs text-blue-600 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {nextSlot.start_time?.substring(0, 5)} – {nextSlot.end_time?.substring(0, 5)}
                  </p>
                  {nextSlot.room && <p className="text-xs text-gray-400">🏫 {nextSlot.room}</p>}
                </div>
              ) : (
                <p className="text-xs text-gray-400 text-center py-2">Plus de cours aujourd'hui</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
