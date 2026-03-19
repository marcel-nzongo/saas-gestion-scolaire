'use client';

import { useState, useEffect } from 'react';
import { Video, Calendar, Clock, Users, BookOpen, ExternalLink } from 'lucide-react';
import { academicApi, academicYearApi } from '@/lib/academic-api';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';

export default function StudentVirtualClassPage() {
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<any[]>([]);
  const [academicYear, setAcademicYear] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        const yearRes = await academicYearApi.getCurrent();
        setAcademicYear(yearRes.data.data);
        const res = await academicApi.get(`/virtual-classes/student?academic_year_id=${yearRes.data.data.id}`);
        setSessions(res.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const getStatusBadge = (status: string) => {
    if (status === 'live') return 'bg-red-100 text-red-700';
    if (status === 'scheduled') return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-500';
  };

  const getStatusLabel = (status: string) => {
    if (status === 'live') return '🔴 En direct';
    if (status === 'scheduled') return '📅 Planifiée';
    return '✅ Terminée';
  };

  const filtered = sessions.filter(s => filter === 'all' || s.status === filter);
  const liveSessions = sessions.filter(s => s.status === 'live');

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="p-8">
      {/* Jitsi plein écran */}
      {activeSession && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-900">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-white font-medium">{activeSession.title}</span>
              <span className="text-gray-400 text-sm">{activeSession.subject_name}</span>
            </div>
            <button
              onClick={() => setActiveSession(null)}
              className="px-3 py-1.5 text-xs text-white bg-red-600 rounded-lg hover:bg-red-700"
            >
              Quitter
            </button>
          </div>
          <iframe
            src={`https://meet.jit.si/${activeSession.jitsi_room}#config.prejoinPageEnabled=false&userInfo.displayName=${encodeURIComponent((user?.first_name || '') + ' ' + (user?.last_name || ''))}`}
            className="flex-1 w-full"
            allow="camera; microphone; fullscreen; display-capture"
          />
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Video className="w-6 h-6 text-violet-600" />Classe virtuelle
        </h1>
        <p className="text-gray-500 mt-1">{academicYear?.name} · Rejoignez vos cours en ligne</p>
      </div>

      {/* Sessions en direct */}
      {liveSessions.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-red-500 uppercase mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse inline-block" />
            Cours en direct maintenant
          </p>
          <div className="grid grid-cols-2 gap-4">
            {liveSessions.map(session => (
              <div key={session.id} className="bg-red-50 border-2 border-red-200 rounded-xl p-5">
                <h3 className="font-bold text-gray-900 mb-1">{session.title}</h3>
                <p className="text-xs text-gray-500 mb-3">
                  {session.subject_name} · Prof. {session.teacher_name}
                </p>
                <button
                  onClick={() => setActiveSession(session)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  <Video className="w-4 h-4" />Rejoindre maintenant
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'all', label: 'Toutes' },
          { key: 'scheduled', label: 'À venir' },
          { key: 'live', label: 'En direct' },
          { key: 'ended', label: 'Passées' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              filter === f.key ? 'bg-violet-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Video className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucune séance</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filtered.map((session) => (
            <Card key={session.id} padding="none">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', getStatusBadge(session.status))}>
                      {getStatusLabel(session.status)}
                    </span>
                    <h3 className="font-bold text-gray-900 mt-2">{session.title}</h3>
                    {session.description && <p className="text-xs text-gray-500 mt-0.5">{session.description}</p>}
                  </div>
                </div>

                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(session.scheduled_at).toLocaleDateString('fr-FR', {
                      weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                    })}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3.5 h-3.5" />{session.duration_minutes} minutes
                  </div>
                  {session.subject_name && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <BookOpen className="w-3.5 h-3.5" />{session.subject_name}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Users className="w-3.5 h-3.5" />Prof. {session.teacher_name}
                  </div>
                </div>

                {session.status === 'live' && (
                  <button
                    onClick={() => setActiveSession(session)}
                    className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 animate-pulse"
                  >
                    <Video className="w-3.5 h-3.5" />Rejoindre
                  </button>
                )}
                {session.status === 'scheduled' && (
                  <div className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg">
                    <Calendar className="w-3.5 h-3.5" />Cours à venir
                  </div>
                )}
                {session.status === 'ended' && (
                  <div className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-gray-400 bg-gray-50 rounded-lg">
                    Séance terminée
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
