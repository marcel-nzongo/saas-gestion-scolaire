'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Users, ChevronRight } from 'lucide-react';
import { academicApi } from '@/lib/academic-api';
import { Card } from '@/components/ui/Card';

export default function TeacherClassesPage() {
  const router = useRouter();
  const [teacherData, setTeacherData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    academicApi.get('/teachers/me')
      .then((res) => setTeacherData(res.data.data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  // Grouper les assignations par classe
  const classesByGroup = teacherData?.assignments
    ? teacherData.assignments.reduce((acc: any, assignment: any) => {
        const classId = assignment.class_id;
        if (!acc[classId]) {
          acc[classId] = {
            id: classId,
            name: assignment.class_name,
            is_main_teacher: assignment.is_main_teacher,
            subjects: [],
          };
        }
        acc[classId].subjects.push({
          id: assignment.subject_id,
          name: assignment.subject_name,
          color: assignment.subject_color,
        });
        return acc;
      }, {})
    : {};

  const classes = Object.values(classesByGroup);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-8">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Mes classes</h1>
        <p className="text-gray-500 mt-1">
          {classes.length} classe{classes.length > 1 ? 's' : ''} assignée
          {classes.length > 1 ? 's' : ''}
        </p>
      </div>

      {classes.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            Aucune classe assignée pour le moment
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Contactez votre administrateur
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {(classes as any[]).map((cls) => (
            <Card key={cls.id} padding="sm">
              <div className="p-6">

                {/* En-tête classe */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-gray-900 text-lg">
                        {cls.name}
                      </h2>
                      {cls.is_main_teacher && (
                        <span className="text-xs text-blue-600 font-medium">
                          Professeur principal
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                      {cls.subjects.length} matière
                      {cls.subjects.length > 1 ? 's' : ''}
                    </span>
                    <button
                      onClick={() => router.push(`/teacher/grades?class=${cls.id}`)}
                      className="flex items-center gap-2 text-sm text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Users className="w-4 h-4" />
                      Saisir notes
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Matières */}
                <div className="flex flex-wrap gap-2">
                  {cls.subjects.map((subject: any) => (
                    <div
                      key={subject.id}
                      className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2"
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: subject.color || '#6366f1' }}
                      />
                      <span className="text-sm text-gray-700 font-medium">
                        {subject.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}