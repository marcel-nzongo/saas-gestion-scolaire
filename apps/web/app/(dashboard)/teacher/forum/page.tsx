'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageSquare, Plus, Pin, ChevronRight, BookOpen,
} from 'lucide-react';
import { academicApi, academicYearApi } from '@/lib/academic-api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export default function TeacherForumPage() {
  const router = useRouter();
  const [teacherData, setTeacherData] = useState<any>(null);
  const [academicYear, setAcademicYear] = useState<any>(null);
  const [topics, setTopics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [form, setForm] = useState({
    title: '',
    content: '',
    is_pinned: false,
    class_id: '',
    subject_id: '',
  });

  useEffect(() => {
    Promise.all([
      academicApi.get('/teachers/me'),
      academicYearApi.getCurrent(),
    ]).then(([teacherRes, yearRes]) => {
      setTeacherData(teacherRes.data.data);
      setAcademicYear(yearRes.data.data);
    });
  }, []);

  const availableClasses = teacherData?.assignments
    ? [...new Map(
        teacherData.assignments.map((a: any) => [a.class_id, {
          id: a.class_id,
          name: a.class_name,
        }])
      ).values()]
    : [];

  const availableSubjects = (classId: string) => teacherData?.assignments
    ? teacherData.assignments
        .filter((a: any) => a.class_id === classId)
        .map((a: any) => ({ id: a.subject_id, name: a.subject_name }))
    : [];

  const loadTopics = async () => {
    if (!selectedClassId || !selectedSubjectId || !academicYear) return;
    setIsLoading(true);
    try {
      const res = await academicApi.get(
        `/resources/forum/topics?class_id=${selectedClassId}&subject_id=${selectedSubjectId}&academic_year_id=${academicYear.id}`
      );
      setTopics(res.data.data || []);
    } catch {
      console.error('Erreur chargement topics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTopics();
  }, [selectedClassId, selectedSubjectId, academicYear]);

  const handleCreateTopic = async () => {
    if (!form.title || !form.content || !form.class_id || !form.subject_id) {
      alert('Veuillez remplir tous les champs');
      return;
    }
    try {
      await academicApi.post('/resources/forum/topics', {
        ...form,
        academic_year_id: academicYear.id,
      });
      await loadTopics();
      setShowModal(false);
      setForm({ title: '', content: '', is_pinned: false, class_id: '', subject_id: '' });
    } catch {
      alert('Erreur lors de la création');
    }
  };

  const handleDeleteTopic = async (id: string) => {
    if (!confirm('Supprimer ce topic ?')) return;
    try {
      await academicApi.delete(`/resources/forum/topics/${id}`);
      await loadTopics();
    } catch {
      alert('Erreur lors de la suppression');
    }
  };

  return (
    <div className="p-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Forum</h1>
          <p className="text-gray-500 mt-1">
            Discussions avec vos élèves par matière
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouveau topic
        </Button>
      </div>

      {/* Filtres */}
      <Card className="mb-6">
        <div className="flex gap-4 p-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Classe *
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setSelectedSubjectId('');
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner une classe</option>
              {(availableClasses as any[]).map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Matière *
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              disabled={!selectedClassId}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="">Sélectionner une matière</option>
              {availableSubjects(selectedClassId).map((sub: any) => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Liste topics */}
      {!selectedClassId || !selectedSubjectId ? (
        <div className="text-center py-16">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            Sélectionnez une classe et une matière
          </p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : topics.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucun topic pour le moment</p>
          <p className="text-gray-400 text-sm mt-1">
            Créez le premier topic pour démarrer la discussion
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {topics.map((topic) => (
            <Card key={topic.id} padding="sm">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => router.push(`/teacher/forum/${topic.id}`)}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center',
                    topic.is_pinned ? 'bg-yellow-50' : 'bg-blue-50',
                  )}>
                    {topic.is_pinned
                      ? <Pin className="w-5 h-5 text-yellow-500" />
                      : <MessageSquare className="w-5 h-5 text-blue-500" />
                    }
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {topic.is_pinned && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                          Épinglé
                        </span>
                      )}
                      <p className="font-semibold text-gray-900">{topic.title}</p>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                      {topic.content}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-400">
                        {topic.author_first_name} {topic.author_last_name}
                      </span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-400">
                        {new Date(topic.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTopic(topic.id);
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    ✕
                  </button>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal nouveau topic */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                Nouveau topic
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Classe *
                  </label>
                  <select
                    value={form.class_id}
                    onChange={(e) => setForm({ ...form, class_id: e.target.value, subject_id: '' })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner</option>
                    {(availableClasses as any[]).map((cls) => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Matière *
                  </label>
                  <select
                    value={form.subject_id}
                    onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
                    disabled={!form.class_id}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <option value="">Sélectionner</option>
                    {availableSubjects(form.class_id).map((sub: any) => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Titre *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ex: Questions sur le chapitre 1"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Message *
                </label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Écrivez votre message..."
                  rows={4}
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_pinned"
                  checked={form.is_pinned}
                  onChange={(e) => setForm({ ...form, is_pinned: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="is_pinned" className="text-sm text-gray-700">
                  Épingler ce topic
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreateTopic}>
                Créer le topic
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}