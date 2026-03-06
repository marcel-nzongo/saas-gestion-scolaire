'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Pin, ChevronRight } from 'lucide-react';
import { academicApi, academicYearApi } from '@/lib/academic-api';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export default function ParentForumPage() {
  const router = useRouter();
  const [parentData, setParentData] = useState<any>(null);
  const [academicYear, setAcademicYear] = useState<any>(null);
  const [topics, setTopics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  useEffect(() => {
    Promise.all([
      academicApi.get('/parents/me'),
      academicYearApi.getCurrent(),
    ]).then(([parentRes, yearRes]) => {
      setParentData(parentRes.data.data);
      setAcademicYear(yearRes.data.data);
    });
  }, []);

  const selectedStudent = parentData?.students?.find(
    (s: any) => s.id === selectedStudentId
  );

  useEffect(() => {
    if (!selectedStudentId || !selectedSubjectId || !academicYear) return;
    setIsLoading(true);
    academicApi.get(
      `/resources/forum/topics?class_id=${selectedStudent?.class_id}&subject_id=${selectedSubjectId}&academic_year_id=${academicYear.id}`
    ).then((res) => setTopics(res.data.data || []))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [selectedStudentId, selectedSubjectId, academicYear]);

  // Matières disponibles selon l'enfant sélectionné
  const [availableSubjects, setAvailableSubjects] = useState<any[]>([]);

useEffect(() => {
  if (!selectedStudentId || !selectedStudent) return;
  academicApi.get(`/classes/${selectedStudent.class_id}/subjects`)
    .then((res) => setAvailableSubjects(res.data.data || []))
    .catch(() => {
      // Fallback : récupérer toutes les matières
      academicApi.get('/subjects')
        .then((res2) => setAvailableSubjects(res2.data.data || []))
        .catch(console.error);
    });
}, [selectedStudentId]);
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Forum</h1>
        <p className="text-gray-500 mt-1">
          Discussions avec les enseignants
        </p>
      </div>

      {/* Filtres */}
      <Card className="mb-6">
        <div className="flex gap-4 p-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Enfant *
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => {
                setSelectedStudentId(e.target.value);
                setSelectedSubjectId('');
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Sélectionner un enfant</option>
              {parentData?.students?.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.last_name} {s.first_name}
                </option>
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
              disabled={!selectedStudentId}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
            >
              <option value="">Sélectionner une matière</option>
              {availableSubjects.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {!selectedStudentId ? (
        <div className="text-center py-16">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            Sélectionnez un enfant pour voir le forum
          </p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
        </div>
      ) : topics.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucun topic disponible</p>
        </div>
      ) : (
        <div className="space-y-3">
          {topics.map((topic) => (
            <Card key={topic.id} padding="sm">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => router.push(`/parent/forum/${topic.id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center',
                    topic.is_pinned ? 'bg-yellow-50' : 'bg-green-50',
                  )}>
                    {topic.is_pinned
                      ? <Pin className="w-5 h-5 text-yellow-500" />
                      : <MessageSquare className="w-5 h-5 text-green-500" />
                    }
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      {topic.is_pinned && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                          Épinglé
                        </span>
                      )}
                      <p className="font-semibold text-gray-900">{topic.title}</p>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                      {topic.content}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {topic.author_first_name} {topic.author_last_name} ·{' '}
                      {new Date(topic.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}