'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Pin, ChevronRight } from 'lucide-react';
import { academicApi, academicYearApi } from '@/lib/academic-api';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export default function StudentForumPage() {
  const router = useRouter();
  const [studentData, setStudentData] = useState<any>(null);
  const [academicYear, setAcademicYear] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      academicApi.get('/students/me'),
      academicYearApi.getCurrent(),
    ]).then(([studentRes, yearRes]) => {
      setStudentData(studentRes.data.data);
      setAcademicYear(yearRes.data.data);
    });
  }, []);

  useEffect(() => {
    if (!studentData) return;
    academicApi.get(`/classes/${studentData.class_id}/subjects`)
      .then((res) => setSubjects(res.data.data || []))
      .catch(() => {
        academicApi.get('/subjects')
          .then((res) => setSubjects(res.data.data || []));
      });
  }, [studentData]);

  useEffect(() => {
    if (!selectedSubjectId || !studentData || !academicYear) return;
    setIsLoading(true);
    academicApi.get(
      `/resources/forum/topics?class_id=${studentData.class_id}&subject_id=${selectedSubjectId}&academic_year_id=${academicYear.id}`
    ).then((res) => setTopics(res.data.data || []))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [selectedSubjectId, studentData, academicYear]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Forum</h1>
        <p className="text-gray-500 mt-1">Discussions avec vos enseignants</p>
      </div>

      <Card className="mb-6">
        <div className="p-4">
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Matière *
          </label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Sélectionner une matière</option>
            {subjects.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </Card>

      {!selectedSubjectId ? (
        <div className="text-center py-16">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            Sélectionnez une matière pour voir le forum
          </p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
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
                onClick={() => router.push(`/student/forum/${topic.id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center',
                    topic.is_pinned ? 'bg-yellow-50' : 'bg-purple-50',
                  )}>
                    {topic.is_pinned
                      ? <Pin className="w-5 h-5 text-yellow-500" />
                      : <MessageSquare className="w-5 h-5 text-purple-500" />
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