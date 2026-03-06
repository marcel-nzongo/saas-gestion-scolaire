'use client';

import { useState, useEffect } from 'react';
import { FileText, Video, BookOpen, Filter } from 'lucide-react';
import { academicApi, academicYearApi } from '@/lib/academic-api';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export default function ParentResourcesPage() {
  const [parentData, setParentData] = useState<any>(null);
  const [academicYear, setAcademicYear] = useState<any>(null);
  const [resources, setResources] = useState<any[]>([]);
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
    if (!academicYear || !selectedStudentId) return;
    setIsLoading(true);
    const params = new URLSearchParams({
      academic_year_id: academicYear.id,
      class_id: selectedStudent?.class_id || '',
      ...(selectedSubjectId && { subject_id: selectedSubjectId }),
    });
    academicApi.get(`/resources?${params}`)
      .then((res) => setResources(res.data.data || []))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [academicYear, selectedStudentId, selectedSubjectId]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Ressources pédagogiques</h1>
        <p className="text-gray-500 mt-1">
          Cours et documents partagés par les enseignants
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
        </div>
      </Card>

      {!selectedStudentId ? (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            Sélectionnez un enfant pour voir les ressources
          </p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
        </div>
      ) : resources.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucune ressource disponible</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {resources.map((resource) => (
            <Card key={resource.id} padding="sm">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center',
                    resource.type === 'pdf' ? 'bg-red-50' : 'bg-blue-50',
                  )}>
                    {resource.type === 'pdf'
                      ? <FileText className="w-6 h-6 text-red-500" />
                      : <Video className="w-6 h-6 text-blue-500" />
                    }
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{resource.title}</p>
                    {resource.description && (
                      <p className="text-sm text-gray-500 mt-0.5">{resource.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-400">{resource.subject_name}</span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-400">
                        {resource.teacher_first_name} {resource.teacher_last_name}
                      </span>
                      {resource.file_size && (
                        <>
                          <span className="text-xs text-gray-300">·</span>
                          <span className="text-xs text-gray-400">
                            {formatFileSize(resource.file_size)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <a href={`http://localhost:3002${resource.file_url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                >
                  {'Ouvrir'}
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}