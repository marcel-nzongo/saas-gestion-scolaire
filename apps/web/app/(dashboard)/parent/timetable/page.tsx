'use client';

import { useState, useEffect } from 'react';
import { Clock, ChevronDown } from 'lucide-react';
import { academicApi, academicYearApi } from '@/lib/academic-api';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const HOURS = [
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
];

const COLORS = [
  'bg-blue-50 border-blue-200 text-blue-800',
  'bg-green-50 border-green-200 text-green-800',
  'bg-purple-50 border-purple-200 text-purple-800',
  'bg-orange-50 border-orange-200 text-orange-800',
  'bg-pink-50 border-pink-200 text-pink-800',
  'bg-teal-50 border-teal-200 text-teal-800',
  'bg-yellow-50 border-yellow-200 text-yellow-800',
  'bg-red-50 border-red-200 text-red-800',
];

export default function ParentTimetablePage() {
  const [academicYear, setAcademicYear] = useState<any>(null);
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [yearRes, childrenRes] = await Promise.all([
          academicYearApi.getCurrent(),
          academicApi.get('/parents/me'),
        ]);
        const year = yearRes.data.data;
        const kids = childrenRes.data.data?.students || [];
        setAcademicYear(year);
        setChildren(kids);
        if (kids.length > 0) setSelectedChild(kids[0]);
      } catch (err) {
        console.error('Erreur chargement:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedChild?.class_id || !academicYear) return;
    setLoading(true);
    academicApi
      .get(
        `/timetable/class/${selectedChild.class_id}?academic_year_id=${academicYear.id}`,
      )
      .then((res) => setSlots(res.data.data || []))
      .catch(() => setSlots([]))
      .finally(() => setLoading(false));
  }, [selectedChild, academicYear]);

  const subjectColorMap: Record<string, string> = {};
  const subjectsSeen: string[] = [];
  slots.forEach((s) => {
    if (!subjectColorMap[s.subject_id]) {
      subjectColorMap[s.subject_id] =
        COLORS[subjectsSeen.length % COLORS.length];
      subjectsSeen.push(s.subject_id);
    }
  });

  const getSlotsForCell = (day: number, hour: string) =>
    slots.filter(
      (s) => s.day_of_week === day && s.start_time?.substring(0, 5) === hour,
    );

  const today = new Date().getDay();
  const todaySlots = slots.filter((s) => s.day_of_week === today);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Emploi du temps</h1>
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
                <span className="text-xs opacity-70">· {child.class_name}</span>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Enfant sélectionné */}
      {selectedChild && (
        <div className="mb-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm">
            {selectedChild.first_name?.[0]}
          </div>
          <div>
            <p className="font-semibold text-gray-900">
              {selectedChild.first_name} {selectedChild.last_name}
            </p>
            <p className="text-xs text-gray-500">{selectedChild.class_name}</p>
          </div>
        </div>
      )}

      {/* Cours du jour */}
      {todaySlots.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">
            Aujourd'hui
          </h2>
          <div className="flex gap-3 flex-wrap">
            {todaySlots.map((slot) => (
              <div
                key={slot.id}
                className={cn(
                  'rounded-xl border p-3 min-w-36',
                  subjectColorMap[slot.subject_id] || COLORS[0],
                )}
              >
                <p className="font-semibold text-sm">{slot.subject_name}</p>
                <p className="text-xs opacity-70">
                  {slot.start_time?.substring(0, 5)} –{' '}
                  {slot.end_time?.substring(0, 5)}
                </p>
                {slot.teacher_last_name && (
                  <p className="text-xs opacity-60">{slot.teacher_last_name}</p>
                )}
                {slot.room && (
                  <p className="text-xs opacity-60">🏫 {slot.room}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
        </div>
      ) : !selectedChild ? (
        <div className="text-center py-16">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucun enfant trouvé</p>
        </div>
      ) : slots.length === 0 ? (
        <div className="text-center py-16">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            Aucun cours configuré pour cette classe
          </p>
        </div>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="w-20 p-3 bg-gray-50 border-b border-r border-gray-200 text-xs font-semibold text-gray-500 text-left">
                    Heure
                  </th>
                  {DAYS.map((day, i) => (
                    <th
                      key={day}
                      className={cn(
                        'p-3 border-b border-r border-gray-200 text-xs font-semibold text-center min-w-32',
                        i + 1 === today
                          ? 'bg-green-50 text-green-700'
                          : 'bg-gray-50 text-gray-700',
                      )}
                    >
                      {day}
                      {i + 1 === today && (
                        <span className="ml-1 text-green-400">
                          (aujourd'hui)
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HOURS.map((hour) => (
                  <tr key={hour} className="border-b border-gray-100">
                    <td className="p-2 border-r border-gray-200 text-xs text-gray-400 font-medium text-center bg-gray-50">
                      {hour}
                    </td>
                    {DAYS.map((_, dayIdx) => {
                      const day = dayIdx + 1;
                      const cellSlots = getSlotsForCell(day, hour);
                      return (
                        <td
                          key={day}
                          className={cn(
                            'p-1 border-r border-gray-100 align-top h-14',
                            day === today ? 'bg-green-50/30' : '',
                          )}
                        >
                          {cellSlots.map((slot) => (
                            <div
                              key={slot.id}
                              className={cn(
                                'rounded-lg border p-1.5 mb-1 text-xs',
                                subjectColorMap[slot.subject_id] || COLORS[0],
                              )}
                            >
                              <p className="font-semibold truncate">
                                {slot.subject_name}
                              </p>
                              <p className="opacity-70 truncate text-xs">
                                {slot.start_time?.substring(0, 5)} –{' '}
                                {slot.end_time?.substring(0, 5)}
                              </p>
                              {slot.teacher_last_name && (
                                <p className="opacity-60 truncate text-xs">
                                  {slot.teacher_last_name}
                                </p>
                              )}
                              {slot.room && (
                                <p className="opacity-60 text-xs">
                                  🏫 {slot.room}
                                </p>
                              )}
                            </div>
                          ))}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
