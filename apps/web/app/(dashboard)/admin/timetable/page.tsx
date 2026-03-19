'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Clock, BookOpen, User } from 'lucide-react';
import { academicApi, academicYearApi } from '@/lib/academic-api';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const HOURS = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

const COLORS = [
  'bg-blue-100 border-blue-300 text-blue-800',
  'bg-green-100 border-green-300 text-green-800',
  'bg-purple-100 border-purple-300 text-purple-800',
  'bg-orange-100 border-orange-300 text-orange-800',
  'bg-pink-100 border-pink-300 text-pink-800',
  'bg-teal-100 border-teal-300 text-teal-800',
  'bg-yellow-100 border-yellow-300 text-yellow-800',
  'bg-red-100 border-red-300 text-red-800',
];

export default function TimetablePage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [academicYear, setAcademicYear] = useState<any>(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editSlot, setEditSlot] = useState<any>(null);
  const [form, setForm] = useState({
    day_of_week: 1,
    start_time: '08:00',
    end_time: '09:00',
    subject_id: '',
    teacher_id: '',
    room: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      academicApi.get('/classes'),
      academicApi.get('/subjects'),
      academicApi.get('/teachers'),
      academicYearApi.getCurrent(),
    ]).then(([classRes, subjectRes, teacherRes, yearRes]) => {
      setClasses(classRes.data.data || []);
      setSubjects(subjectRes.data.data || []);
      setTeachers(teacherRes.data.data || []);
      setAcademicYear(yearRes.data.data);
    });
  }, []);

  useEffect(() => {
    if (!selectedClass || !academicYear) return;
    fetchSlots();
  }, [selectedClass, academicYear]);

  const fetchSlots = async () => {
    if (!selectedClass || !academicYear) return;
    setLoading(true);
    try {
      const res = await academicApi.get(`/timetable/class/${selectedClass}?academic_year_id=${academicYear.id}`);
      setSlots(res.data.data || []);
    } catch {
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const subjectColorMap: Record<string, string> = {};
  subjects.forEach((s, i) => { subjectColorMap[s.id] = COLORS[i % COLORS.length]; });

  const getSlotsForCell = (day: number, hour: string) => {
    return slots.filter(s => {
      const slotDay = s.day_of_week;
      const slotStart = s.start_time?.substring(0, 5);
      return slotDay === day && slotStart === hour;
    });
  };

  const openCreate = (day: number, hour: string) => {
    setEditSlot(null);
    setForm({ day_of_week: day, start_time: hour, end_time: addHour(hour), subject_id: '', teacher_id: '', room: '' });
    setError('');
    setShowModal(true);
  };

  const openEdit = (slot: any) => {
    setEditSlot(slot);
    setForm({
      day_of_week: slot.day_of_week,
      start_time: slot.start_time?.substring(0, 5),
      end_time: slot.end_time?.substring(0, 5),
      subject_id: slot.subject_id,
      teacher_id: slot.teacher_id || '',
      room: slot.room || '',
    });
    setError('');
    setShowModal(true);
  };

  const addHour = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const handleSave = async () => {
    if (!form.subject_id) { setError('Veuillez choisir une matière'); return; }
    if (form.start_time >= form.end_time) { setError('L\'heure de fin doit être après l\'heure de début'); return; }
    setSaving(true);
    setError('');
    try {
      if (editSlot) {
        await academicApi.put(`/timetable/${editSlot.id}`, form);
      } else {
        await academicApi.post('/timetable', {
          ...form,
          class_id: selectedClass,
          academic_year_id: academicYear.id,
        });
      }
      setShowModal(false);
      await fetchSlots();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce créneau ?')) return;
    try {
      await academicApi.delete(`/timetable/${id}`);
      await fetchSlots();
    } catch {
      alert('Erreur lors de la suppression');
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Emploi du temps</h1>
          <p className="text-gray-500 mt-1">{academicYear?.name}</p>
        </div>
      </div>

      {/* Sélection classe */}
      <Card className="mb-6">
        <div className="p-4 flex gap-4 items-end flex-wrap">
          <div className="flex-1 min-w-48">
            <label className="block text-xs font-medium text-gray-500 mb-1">Classe</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Choisir une classe --</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          {selectedClass && (
            <p className="text-xs text-gray-400 pb-2">
              {slots.length} créneau{slots.length > 1 ? 'x' : ''} configuré{slots.length > 1 ? 's' : ''}
            </p>
          )}
        </div>
      </Card>

      {!selectedClass ? (
        <div className="text-center py-16">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Sélectionnez une classe pour voir son emploi du temps</p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="w-20 p-3 bg-gray-50 border-b border-r border-gray-200 text-xs font-semibold text-gray-500 text-left">Heure</th>
                  {DAYS.map((day) => (
                    <th key={day} className="p-3 bg-gray-50 border-b border-r border-gray-200 text-xs font-semibold text-gray-700 text-center min-w-36">
                      {day}
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
                          className="p-1 border-r border-gray-100 align-top h-16 relative group"
                        >
                          {cellSlots.map((slot) => (
                            <div
                              key={slot.id}
                              className={cn(
                                'rounded-lg border p-1.5 mb-1 text-xs cursor-pointer relative',
                                subjectColorMap[slot.subject_id] || COLORS[0],
                              )}
                              onClick={() => openEdit(slot)}
                            >
                              <p className="font-semibold truncate">{slot.subject_name}</p>
                              <p className="opacity-70 truncate">
                                {slot.start_time?.substring(0, 5)} – {slot.end_time?.substring(0, 5)}
                              </p>
                              {slot.teacher_first_name && (
                                <p className="opacity-60 truncate text-xs">
                                  {slot.teacher_last_name} {slot.teacher_first_name?.[0]}.
                                </p>
                              )}
                              {slot.room && <p className="opacity-60 truncate">🏫 {slot.room}</p>}
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(slot.id); }}
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4 flex items-center justify-center rounded bg-white/70 hover:bg-red-100"
                              >
                                <Trash2 className="w-3 h-3 text-red-500" />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => openCreate(day, hour)}
                            className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                          >
                            <Plus className="w-4 h-4 text-gray-400" />
                          </button>
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

      {/* Modal ajout/édition */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {editSlot ? 'Modifier le créneau' : 'Nouveau créneau'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {DAYS[form.day_of_week - 1]} · {form.start_time} – {form.end_time}
              </p>
            </div>
            <div className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Jour</label>
                  <select
                    value={form.day_of_week}
                    onChange={(e) => setForm({ ...form, day_of_week: parseInt(e.target.value) })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {DAYS.map((d, i) => <option key={i} value={i + 1}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Salle</label>
                  <input
                    type="text"
                    value={form.room}
                    onChange={(e) => setForm({ ...form, room: e.target.value })}
                    placeholder="ex: Salle 12"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Heure début</label>
                  <input
                    type="time"
                    value={form.start_time}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Heure fin</label>
                  <input
                    type="time"
                    value={form.end_time}
                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  <BookOpen className="w-3 h-3 inline mr-1" />Matière *
                </label>
                <select
                  value={form.subject_id}
                  onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choisir une matière --</option>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  <User className="w-3 h-3 inline mr-1" />Professeur
                </label>
                <select
                  value={form.teacher_id}
                  onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Aucun --</option>
                  {teachers.map((t) => (
                    <option key={t.user_id || t.id} value={t.user_id || t.id}>
                      {t.last_name} {t.first_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />Sauvegarde...</> : editSlot ? 'Modifier' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
