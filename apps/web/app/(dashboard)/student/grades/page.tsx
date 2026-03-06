'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Award, BookOpen } from 'lucide-react';
import { academicApi, academicYearApi, gradeApi } from '@/lib/academic-api';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

const gradeTypeLabels: Record<string, string> = {
  exam: 'Examen', quiz: 'Interrogation',
  homework: 'Devoir', project: 'Projet', oral: 'Oral',
};

const gradeTypeColors: Record<string, string> = {
  exam: 'bg-purple-100 text-purple-700',
  quiz: 'bg-blue-100 text-blue-700',
  homework: 'bg-green-100 text-green-700',
  project: 'bg-orange-100 text-orange-700',
  oral: 'bg-pink-100 text-pink-700',
};

export default function StudentGradesPage() {
  const [studentData, setStudentData] = useState<any>(null);
  const [academicYear, setAcademicYear] = useState<any>(null);
  const [selectedTerm, setSelectedTerm] = useState(1);
  const [reportData, setReportData] = useState<any>(null);
  const [allGrades, setAllGrades] = useState<any[]>([]);
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
    if (!studentData || !academicYear) return;
    loadGrades();
  }, [studentData, academicYear, selectedTerm]);

  const loadGrades = async () => {
    setIsLoading(true);
    try {
      const [avgRes, gradesRes] = await Promise.all([
        gradeApi.getStudentAverage(studentData.id, {
          term: selectedTerm,
          academic_year_id: academicYear.id,
        }),
        gradeApi.getAll({
          student_id: studentData.id,
          term: selectedTerm,
          academic_year_id: academicYear.id,
        }),
      ]);
      setReportData(avgRes.data.data);
      setAllGrades(gradesRes.data.data || []);
    } catch {
      console.error('Erreur chargement notes');
    } finally {
      setIsLoading(false);
    }
  };

  const gradesBySubject = allGrades.reduce((acc: any, grade: any) => {
    const subjectId = grade.subject_id;
    if (!acc[subjectId]) {
      acc[subjectId] = {
        subject_name: grade.subject_name,
        subject_color: grade.subject_color,
        grades: [],
      };
    }
    acc[subjectId].grades.push(grade);
    return acc;
  }, {});

  const subjectAverages = Object.values(gradesBySubject).map((sub: any) => {
    const total = sub.grades.reduce(
      (sum: number, g: any) => sum + (g.value / g.max_value) * 20, 0,
    );
    const avg = sub.grades.length > 0
      ? Math.round((total / sub.grades.length) * 100) / 100
      : null;
    return { ...sub, average: avg };
  });

  const getMention = (avg: number | null) => {
    if (avg === null) return { label: '—', color: 'text-gray-400' };
    if (avg >= 18) return { label: 'Excellent', color: 'text-green-600' };
    if (avg >= 16) return { label: 'Très Bien', color: 'text-green-500' };
    if (avg >= 14) return { label: 'Bien', color: 'text-blue-600' };
    if (avg >= 12) return { label: 'Assez Bien', color: 'text-blue-500' };
    if (avg >= 10) return { label: 'Passable', color: 'text-orange-500' };
    return { label: 'Insuffisant', color: 'text-red-600' };
  };

  const mention = getMention(reportData?.average || null);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Mes notes</h1>
        <p className="text-gray-500 mt-1">{academicYear?.name}</p>
      </div>

      {/* Sélecteur trimestre */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3].map((term) => (
          <button
            key={term}
            onClick={() => setSelectedTerm(term)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              selectedTerm === term
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            )}
          >
            {term === 1 ? '1er' : `${term}ème`} trimestre
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
        </div>
      ) : !reportData ? (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            Aucune note pour ce trimestre
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card padding="sm">
              <div className="flex items-center gap-3 p-4">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Moyenne générale</p>
                  <p className={cn('text-2xl font-bold', mention.color)}>
                    {reportData.average}/20
                  </p>
                </div>
              </div>
            </Card>
            <Card padding="sm">
              <div className="flex items-center gap-3 p-4">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <Award className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Mention</p>
                  <p className={cn('text-lg font-bold', mention.color)}>
                    {mention.label}
                  </p>
                </div>
              </div>
            </Card>
            <Card padding="sm">
              <div className="flex items-center gap-3 p-4">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Matières</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reportData.total_subjects}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <Card padding="sm">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Détail par matière</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {subjectAverages.map((sub: any, idx: number) => (
                <div key={idx} className="px-4 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: sub.subject_color }}
                      />
                      <h3 className="font-semibold text-gray-900">
                        {sub.subject_name}
                      </h3>
                    </div>
                    <span className={cn(
                      'text-lg font-bold',
                      sub.average !== null
                        ? sub.average >= 10 ? 'text-green-600' : 'text-red-600'
                        : 'text-gray-400',
                    )}>
                      {sub.average !== null ? `${sub.average}/20` : '—'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {sub.grades.map((grade: any) => (
                      <div
                        key={grade.id}
                        className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                      >
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            'text-xs px-2 py-0.5 rounded-full font-medium',
                            gradeTypeColors[grade.type] || 'bg-gray-100 text-gray-600',
                          )}>
                            {gradeTypeLabels[grade.type] || grade.type}
                          </span>
                          {grade.title && (
                            <span className="text-sm text-gray-600">{grade.title}</span>
                          )}
                          <span className="text-xs text-gray-400">
                            {new Date(grade.graded_at).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <span className={cn(
                          'text-base font-bold',
                          (grade.value / grade.max_value) * 20 >= 10
                            ? 'text-green-600'
                            : 'text-red-600',
                        )}>
                          {grade.value}/{grade.max_value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}