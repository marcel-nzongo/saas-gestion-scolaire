'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, TrendingUp, Eye } from 'lucide-react';
import {
  gradeApi,
  classApi,
  academicYearApi,
  Class,
  AcademicYear,
} from '@/lib/academic-api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export default function ReportsPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [academicYear, setAcademicYear] = useState<AcademicYear | null>(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTerm, setSelectedTerm] = useState(1);
  const [reportCards, setReportCards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    Promise.all([classApi.getAll(), academicYearApi.getCurrent()]).then(
      ([classRes, yearRes]) => {
        setClasses(classRes.data.data || []);
        setAcademicYear(yearRes.data.data);
      },
    );
  }, []);

  const loadReportCards = async () => {
    if (!selectedClass || !academicYear) return;
    setIsLoading(true);
    try {
      const res = await gradeApi.getClassReportCards(selectedClass, {
        term: selectedTerm,
        academic_year_id: academicYear.id,
      });
      setReportCards(res.data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReportCards();
  }, [selectedClass, selectedTerm, academicYear]);

  const handleGenerateAll = async () => {
    if (!academicYear || !selectedClass) return;
    setIsGenerating(true);
    try {
      for (const rc of reportCards) {
        if (rc.average !== null) {
          await gradeApi.generateReportCard(rc.student.id, {
            term: selectedTerm,
            academic_year_id: academicYear.id,
          });
        }
      }
      await loadReportCards();
    } catch (error) {
      alert('Erreur lors de la génération');
    } finally {
      setIsGenerating(false);
    }
  };

  const getAverageColor = (avg: number | null) => {
    if (avg === null) return 'text-gray-300';
    if (avg >= 16) return 'text-green-600 font-bold';
    if (avg >= 14) return 'text-blue-600 font-semibold';
    if (avg >= 10) return 'text-orange-500';
    return 'text-red-600 font-bold';
  };

  const getMention = (avg: number | null) => {
    if (avg === null) return '—';
    if (avg >= 18) return 'Excellent';
    if (avg >= 16) return 'Très Bien';
    if (avg >= 14) return 'Bien';
    if (avg >= 12) return 'Assez Bien';
    if (avg >= 10) return 'Passable';
    return 'Insuffisant';
  };

  const classeAverage =
    reportCards.filter((r) => r.average !== null).length > 0
      ? (
          reportCards
            .filter((r) => r.average !== null)
            .reduce((sum, r) => sum + r.average, 0) /
          reportCards.filter((r) => r.average !== null).length
        ).toFixed(2)
      : null;

  const tauxReussite =
    reportCards.filter((r) => r.average !== null).length > 0
      ? Math.round(
          (reportCards.filter((r) => r.average !== null && r.average >= 10)
            .length /
            reportCards.filter((r) => r.average !== null).length) *
            100,
        )
      : 0;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bulletins</h1>
          <p className="text-gray-500 mt-1">
            Génération et consultation des bulletins — {academicYear?.name}
          </p>
        </div>
        {selectedClass && reportCards.length > 0 && (
          <Button onClick={handleGenerateAll} isLoading={isGenerating}>
            <FileText className="w-4 h-4 mr-2" />
            Générer tous les bulletins
          </Button>
        )}
      </div>

      {/* Filtres */}
      <Card className="mb-6">
        <div className="flex gap-4 items-end p-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Classe
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner une classe</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Trimestre
            </label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(Number(e.target.value))}
              className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>1er trimestre</option>
              <option value={2}>2ème trimestre</option>
              <option value={3}>3ème trimestre</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Contenu */}
      {!selectedClass ? (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            Sélectionnez une classe pour voir les bulletins
          </p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          {reportCards.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card padding="sm">
                <div className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Moyenne classe</p>
                    <p className="text-xl font-bold text-gray-900">
                      {classeAverage ? `${classeAverage}/20` : '—'}
                    </p>
                  </div>
                </div>
              </Card>
              <Card padding="sm">
                <div className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Bulletins générés</p>
                    <p className="text-xl font-bold text-gray-900">
                      {reportCards.filter((r) => r.is_generated).length}/
                      {reportCards.length}
                    </p>
                  </div>
                </div>
              </Card>
              <Card padding="sm">
                <div className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Taux de réussite</p>
                    <p className="text-xl font-bold text-gray-900">
                      {tauxReussite}%
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          <Card padding="sm">
            {reportCards.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Aucun élève dans cette classe</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                      Rang
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                      Élève
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                      Moyenne
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                      Mention
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                      Matières
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                      Bulletin
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {reportCards.map((rc, index) => (
                    <tr
                      key={rc.student.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div
                          className={cn(
                            'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
                            index === 0
                              ? 'bg-yellow-100 text-yellow-700'
                              : index === 1
                                ? 'bg-gray-100 text-gray-600'
                                : index === 2
                                  ? 'bg-orange-100 text-orange-600'
                                  : 'text-gray-400',
                          )}
                        >
                          {index + 1}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm font-medium text-gray-900">
                          {rc.student.last_name} {rc.student.first_name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {rc.student.student_code}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={cn('text-lg', getAverageColor(rc.average))}
                        >
                          {rc.average !== null ? `${rc.average}/20` : '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={cn(
                            'text-xs font-medium px-2 py-1 rounded-full',
                            rc.average >= 16
                              ? 'bg-green-100 text-green-700'
                              : rc.average >= 14
                                ? 'bg-blue-100 text-blue-700'
                                : rc.average >= 10
                                  ? 'bg-orange-100 text-orange-700'
                                  : rc.average !== null
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-gray-100 text-gray-400',
                          )}
                        >
                          {getMention(rc.average)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm text-gray-600">
                          {rc.total_subjects}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {rc.is_generated ? (
                          <button
                            onClick={() =>
                              router.push(
                                `/admin/grades/reports/${rc.student.id}`,
                              )
                            }
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Voir le bulletin"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">
                            Non généré
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
