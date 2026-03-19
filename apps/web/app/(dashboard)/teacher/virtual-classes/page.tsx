'use client';

import { useState, useEffect } from 'react';
import {
  Video, Plus, Calendar, Clock, Users, BookOpen,
  Play, Trash2, FileText, Link, X, CheckCircle, Eye
} from 'lucide-react';
import { academicApi, academicYearApi } from '@/lib/academic-api';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export default function TeacherVirtualClassPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [teacherData, setTeacherData] = useState<any>(null);
  const [academicYear, setAcademicYear] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [filter, setFilter] = useState('all');

  const [form, setForm] = useState({
    title: '',
    description: '',
    class_id: '',
    subject_id: '',
    scheduled_at: '',
    duration_minutes: 60,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [teacherRes, yearRes, classesRes, subjectsRes] = await Promise.all([
          academicApi.get('/teachers/me'),
          academicYearApi.getCurrent(),
          academicApi.get('/classes'),
          academicApi.get('/subjects'),
        ]);
        setTeacherData(teacherRes.data.data);
        setAcademicYear(yearRes.data.data);
        setClasses(classesRes.data.data || []);
        setSubjects(subjectsRes.data.data || []);

        const sessionsRes = await academicApi.get(
          `/virtual-classes/my?academic_year_id=${yearRes.data.data.id}`
        );
        setSessions(sessionsRes.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleCreate = async () => {
    if (!form.title || !form.scheduled_at) return;
    try {
      const res = await academicApi.post('/virtual-classes', {
        ...form,
        teacher_id: teacherData.id,
        academic_year_id: academicYear.id,
      });
      setSessions((prev) => [res.data.data, ...prev]);
      setShowModal(false);
      setForm({ title: '', description: '', class_id: '', subject_id: '', scheduled_at: '', duration_minutes: 60 });
    } catch (err) {
      console.error(err);
    }
  };

  const handleLaunch = async (session: any) => {
    await academicApi.patch(`/virtual-classes/${session.id}/status`, { status: 'live' });
    setSessions((prev) => prev.map(s => s.id === session.id ? { ...s, status: 'live' } : s));
    setActiveSession({ ...session, status: 'live' });
  };

  const handleEnd = async (session: any) => {
    await academicApi.patch(`/virtual-classes/${session.id}/status`, { status: 'ended' });
    setSessions((prev) => prev.map(s => s.id === session.id ? { ...s, status: 'ended' } : s));
    setActiveSession(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette séance ?')) return;
    await academicApi.delete(`/virtual-classes/${id}`);
    setSessions((prev) => prev.filter(s => s.id !== id));
  };

  const copyLink = (roomName: string) => {
    navigator.clipboard.writeText(`https://meet.jit.si/${roomName}`);
    alert('Lien copié !');
  };

  const filtered = sessions.filter(s => filter === 'all' || s.status === filter);

  const getStatusBadge = (status: string) => {
    if (status === 'live') return 'bg-red-100 text-red-700 animate-pulse';
    if (status === 'scheduled') return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-500';
  };

  const getStatusLabel = (status: string) => {
    if (status === 'live') return '🔴 En direct';
    if (status === 'scheduled') return '📅 Planifiée';
    return '✅ Terminée';
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="p-8">
      {/* Jitsi en plein écran si session active */}
      {activeSession && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-900">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-white font-medium">{activeSession.title}</span>
              <span className="text-gray-400 text-sm">{activeSession.class_name}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => copyLink(activeSession.jitsi_room)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                <Link className="w-3 h-3" />Partager le lien
              </button>
              <button
                onClick={() => handleEnd(activeSession)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                <X className="w-3 h-3" />Terminer la séance
              </button>
            </div>
          </div>
          <iframe
            src={`https://meet.jit.si/${activeSession.jitsi_room}#config.prejoinPageEnabled=false&userInfo.displayName=${encodeURIComponent(teacherData?.first_name + ' ' + teacherData?.last_name)}`}
            className="flex-1 w-full"
            allow="camera; microphone; fullscreen; display-capture"
          />
        </div>
      )}

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Video className="w-6 h-6 text-blue-600" />Classe virtuelle
          </h1>
          <p className="text-gray-500 mt-1">{academicYear?.name} · Gérez vos séances en ligne</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />Nouvelle séance
        </button>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'all', label: 'Toutes' },
          { key: 'scheduled', label: 'Planifiées' },
          { key: 'live', label: 'En direct' },
          { key: 'ended', label: 'Terminées' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              filter === f.key ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Liste séances */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Video className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucune séance</p>
          <p className="text-gray-400 text-sm mt-1">Créez votre première classe virtuelle</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filtered.map((session) => (
            <Card key={session.id} padding="none">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', getStatusBadge(session.status))}>
                        {getStatusLabel(session.status)}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900">{session.title}</h3>
                    {session.description && <p className="text-xs text-gray-500 mt-0.5">{session.description}</p>}
                  </div>
                  <button onClick={() => handleDelete(session.id)} className="text-gray-300 hover:text-red-500 ml-2">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(session.scheduled_at).toLocaleDateString('fr-FR', {
                      weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                    })}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    {session.duration_minutes} minutes
                  </div>
                  {session.class_name && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Users className="w-3.5 h-3.5" />
                      {session.class_name}
                    </div>
                  )}
                  {session.subject_name && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <BookOpen className="w-3.5 h-3.5" />
                      {session.subject_name}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {session.status === 'scheduled' && (
                    <button
                      onClick={() => handleLaunch(session)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                    >
                      <Play className="w-3.5 h-3.5" />Lancer
                    </button>
                  )}
                  {session.status === 'live' && (
                    <button
                      onClick={() => setActiveSession(session)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 animate-pulse"
                    >
                      <Eye className="w-3.5 h-3.5" />Rejoindre
                    </button>
                  )}
                  {session.status === 'ended' && (
                    <div className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium text-gray-400 bg-gray-50 rounded-lg">
                      <CheckCircle className="w-3.5 h-3.5" />Terminée
                    </div>
                  )}
                  <button
                    onClick={() => copyLink(session.jitsi_room)}
                    className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
                  >
                    <Link className="w-3.5 h-3.5" />Lien
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal création */}
      {showModal && (
        <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Nouvelle séance</h2>
              <button onClick={() => setShowModal(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Ex: Cours de Mathématiques - Algèbre"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  placeholder="Objectifs de la séance..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Classe</label>
                  <select
                    value={form.class_id}
                    onChange={e => setForm({ ...form, class_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Toutes</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Matière</label>
                  <select
                    value={form.subject_id}
                    onChange={e => setForm({ ...form, subject_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Aucune</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date et heure *</label>
                  <input
                    type="datetime-local"
                    value={form.scheduled_at}
                    onChange={e => setForm({ ...form, scheduled_at: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durée (min)</label>
                  <input
                    type="number"
                    value={form.duration_minutes}
                    onChange={e => setForm({ ...form, duration_minutes: Number(e.target.value) })}
                    min={15}
                    max={240}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 pt-0 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleCreate}
                disabled={!form.title || !form.scheduled_at}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Créer la séance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
