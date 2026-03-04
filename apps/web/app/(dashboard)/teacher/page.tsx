'use client';

import { useState, useEffect } from 'react';
import {
  BookOpen, Users, ClipboardList, TrendingUp,
} from 'lucide-react';
import { academicApi, academicYearApi } from '@/lib/academic-api';
import { Card } from '@/components/ui/Card';

export default function TeacherDashboard() {
  const [teacherData, setTeacherData] = useState<any>(null);
  const [academicYear, setAcademicYear] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      academicApi.get('/teachers/me'),
      academicYearApi.getCurrent(),
    ]).then(([teacherRes, yearRes]) => {
      setTeacherData(teacherRes.data.data);
      setAcademicYear(yearRes.data.data);
    }).catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const assignments = teacherData?.assignments || [];
  const uniqueClasses = [...new Set(assignments.map((a: any) => a.class_id))];
  const uniqueSubjects = [...new Set(assignments.map((a: any) => a.subject_id))];

  return (
    <div className="p-8">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Bonjour, {teacherData?.first_name} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          {academicYear?.name} — Tableau de bord enseignant
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <Card padding="sm">
          <div className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">
                Mes classes
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {uniqueClasses.length}
              </p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">
                Mes matières
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {uniqueSubjects.length}
              </p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">
                Assignations
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {assignments.length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Mes assignations */}
      <Card>
        <div className="p-6 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">
            Mes classes et matières
          </h2>
        </div>
        {assignments.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              Aucune assignation pour le moment
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {assignments.map((assignment: any) => (
              <div
                key={assignment.id}
                className="flex items-center justify-between px-6 py-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: assignment.subject_color || '#6366f1' }}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {assignment.subject_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {assignment.class_name}
                      {assignment.is_main_teacher && (
                        <span className="ml-2 text-blue-600 font-medium">
                          · Professeur principal
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium">
                  {assignment.class_name}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}