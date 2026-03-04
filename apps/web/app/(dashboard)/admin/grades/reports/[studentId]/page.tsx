'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  FileText,
  TrendingUp,
  Award,
  BookOpen,
  Printer,
} from 'lucide-react';
import { gradeApi, academicYearApi, AcademicYear } from '@/lib/academic-api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

const gradeTypeLabels: Record<string, string> = {
  exam: 'Examen',
  quiz: 'Interrogation',
  homework: 'Devoir',
  project: 'Projet',
  oral: 'Oral',
};

const gradeTypeColors: Record<string, string> = {
  exam: 'bg-purple-100 text-purple-700',
  quiz: 'bg-blue-100 text-blue-700',
  homework: 'bg-green-100 text-green-700',
  project: 'bg-orange-100 text-orange-700',
  oral: 'bg-pink-100 text-pink-700',
};

const getMention = (avg: number | null) => {
  if (avg === null) return { label: '—', color: 'text-gray-400' };
  if (avg >= 18) return { label: 'Excellent', color: 'text-green-600' };
  if (avg >= 16) return { label: 'Très Bien', color: 'text-green-500' };
  if (avg >= 14) return { label: 'Bien', color: 'text-blue-600' };
  if (avg >= 12) return { label: 'Assez Bien', color: 'text-blue-500' };
  if (avg >= 10) return { label: 'Passable', color: 'text-orange-500' };
  return { label: 'Insuffisant', color: 'text-red-600' };
};

const getGradeColor = (value: number, max: number) => {
  const pct = (value / max) * 20;
  if (pct >= 16) return 'text-green-600 font-bold';
  if (pct >= 12) return 'text-blue-600 font-semibold';
  if (pct >= 10) return 'text-orange-500';
  return 'text-red-600 font-semibold';
};

export default function StudentReportPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.studentId as string;

  const [academicYear, setAcademicYear] = useState<AcademicYear | null>(null);
  const [selectedTerm, setSelectedTerm] = useState(1);
  const [reportData, setReportData] = useState<any>(null);
  const [allGrades, setAllGrades] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    academicYearApi.getCurrent().then((res) => {
      setAcademicYear(res.data.data);
    });
  }, []);

  useEffect(() => {
    if (!academicYear) return;
    loadReport();
  }, [academicYear, selectedTerm]);

  const loadReport = async () => {
    if (!academicYear) return;
    setIsLoading(true);
    try {
      const [avgRes, gradesRes] = await Promise.all([
        gradeApi.getStudentAverage(studentId, {
          term: selectedTerm,
          academic_year_id: academicYear.id,
        }),
        gradeApi.getAll({
          student_id: studentId,
          term: selectedTerm,
          academic_year_id: academicYear.id,
        }),
      ]);
      setReportData(avgRes.data.data);
      setAllGrades(gradesRes.data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!academicYear) return;
    try {
      await gradeApi.generateReportCard(studentId, {
        term: selectedTerm,
        academic_year_id: academicYear.id,
      });
      await loadReport();
      alert('Bulletin généré avec succès !');
    } catch (error) {
      alert('Erreur lors de la génération');
    }
  };

  // Grouper les notes par matière
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

  // Calculer moyenne par matière
  const subjectAverages = Object.values(gradesBySubject).map((sub: any) => {
    const total = sub.grades.reduce(
      (sum: number, g: any) => sum + (g.value / g.max_value) * 20,
      0,
    );
    const avg =
      sub.grades.length > 0
        ? Math.round((total / sub.grades.length) * 100) / 100
        : null;
    return { ...sub, average: avg };
  });

  const mention = getMention(reportData?.average || null);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Bulletin scolaire
            </h1>
            <p className="text-gray-500 mt-0.5">
              {academicYear?.name} — Trimestre {selectedTerm}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimer
          </Button>
          <Button onClick={handleGenerate}>
            <FileText className="w-4 h-4 mr-2" />
            Générer bulletin
          </Button>
        </div>
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
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            )}
          >
            {term === 1 ? '1er' : `${term}ème`} trimestre
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : !reportData ? (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            Aucune note pour ce trimestre
          </p>
        </div>
      ) : (
        <>
          {/* Résumé */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card padding="sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
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
              <div className="flex items-center gap-3">
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
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Matières évaluées</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reportData.total_subjects}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Notes par matière */}
          <Card padding="sm">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">
                Détail des notes par matière
              </h2>
            </div>
            {subjectAverages.length === 0 ? (
              <p className="text-center text-gray-400 py-8">
                Aucune note saisie
              </p>
            ) : (
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
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">
                          Moyenne matière :
                        </span>
                        <span
                          className={cn(
                            'text-lg font-bold',
                            sub.average !== null
                              ? getGradeColor(sub.average, 20)
                              : 'text-gray-400',
                          )}
                        >
                          {sub.average !== null ? `${sub.average}/20` : '—'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {sub.grades.map((grade: any) => (
                        <div
                          key={grade.id}
                          className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={cn(
                                'text-xs px-2 py-0.5 rounded-full font-medium',
                                gradeTypeColors[grade.type] ||
                                  'bg-gray-100 text-gray-600',
                              )}
                            >
                              {gradeTypeLabels[grade.type] || grade.type}
                            </span>
                            {grade.title && (
                              <span className="text-sm text-gray-600">
                                {grade.title}
                              </span>
                            )}
                            <span className="text-xs text-gray-400">
                              {new Date(grade.graded_at).toLocaleDateString(
                                'fr-FR',
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              Coeff. {grade.coefficient}
                            </span>
                            <span
                              className={cn(
                                'text-base font-bold min-w-[60px] text-right',
                                getGradeColor(grade.value, grade.max_value),
                              )}
                            >
                              {grade.value}/{grade.max_value}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
