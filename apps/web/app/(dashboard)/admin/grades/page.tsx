'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Save, CheckCircle, Filter } from 'lucide-react';
import {
  gradeApi,
  subjectApi,
  classApi,
  academicYearApi,
  Grade,
  Subject,
  Class,
  AcademicYear,
} from '@/lib/academic-api';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

const gradeTypes = [
  { value: 'exam', label: 'Examen' },
  { value: 'quiz', label: 'Interrogation' },
  { value: 'homework', label: 'Devoir' },
  { value: 'project', label: 'Projet' },
  { value: 'oral', label: 'Oral' },
];

export default function GradesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [academicYear, setAcademicYear] = useState<AcademicYear | null>(null);
  const [grades, setGrades] = useState<Grade[]>([]);

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTerm, setSelectedTerm] = useState(1);
  const [gradeType, setGradeType] = useState('exam');
  const [gradeTitle, setGradeTitle] = useState('');
  const [maxValue, setMaxValue] = useState(20);
  const [gradeValues, setGradeValues] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    Promise.all([
      classApi.getAll(),
      subjectApi.getAll(),
      academicYearApi.getCurrent(),
    ]).then(([classRes, subjectRes, yearRes]) => {
      setClasses(classRes.data.data || []);
      setSubjects(subjectRes.data.data || []);
      setAcademicYear(yearRes.data.data);
    });
  }, []);

  useEffect(() => {
    if (!selectedClass) {
      setStudents([]);
      setGradeValues({});
      return;
    }
    classApi.getStudents(selectedClass).then((res) => {
      setStudents(res.data.data || []);
      setGradeValues({});
    });
  }, [selectedClass]);

  useEffect(() => {
    if (!selectedClass || !selectedSubject || !academicYear) return;
    gradeApi
      .getAll({
        class_id: selectedClass,
        subject_id: selectedSubject,
        term: selectedTerm,
        academic_year_id: academicYear.id,
      })
      .then((res) => {
        setGrades(res.data.data || []);
      });
  }, [selectedClass, selectedSubject, selectedTerm, academicYear]);

  const handleSaveGrades = async () => {
    if (!selectedSubject || !academicYear) return;
    const entries = Object.entries(gradeValues).filter(
      ([, v]) => v !== '' && !isNaN(Number(v)),
    );
    if (entries.length === 0) {
      alert('Aucune note à sauvegarder');
      return;
    }
    setIsSaving(true);
    let count = 0;
    try {
      for (const [studentId, value] of entries) {
        await gradeApi.create({
          student_id: studentId,
          subject_id: selectedSubject,
          academic_year_id: academicYear.id,
          value: Number(value),
          max_value: maxValue,
          term: selectedTerm,
          type: gradeType,
          title: gradeTitle || undefined,
        });
        count++;
      }
      setSavedCount(count);
      setGradeValues({});
      setTimeout(() => setSavedCount(0), 3000);
    } catch (error) {
      alert('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const getGradeColor = (value: number, max: number) => {
    const pct = (value / max) * 20;
    if (pct >= 16) return 'text-green-600 font-bold';
    if (pct >= 12) return 'text-blue-600 font-semibold';
    if (pct >= 10) return 'text-orange-500';
    return 'text-red-600 font-semibold';
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Saisie des notes</h1>
          <p className="text-gray-500 mt-1">
            {academicYear?.name || 'Année scolaire'}
          </p>
        </div>
        {savedCount > 0 && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">
              {savedCount} note{savedCount > 1 ? 's' : ''} sauvegardée
              {savedCount > 1 ? 's' : ''} !
            </span>
          </div>
        )}
      </div>

      {/* Filtres */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-500" />
            <CardTitle>Paramètres de saisie</CardTitle>
          </div>
        </CardHeader>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Classe *
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Matière *
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Trimestre
            </label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>1er trimestre</option>
              <option value={2}>2ème trimestre</option>
              <option value={3}>3ème trimestre</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Type
            </label>
            <select
              value={gradeType}
              onChange={(e) => setGradeType(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {gradeTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Note / Max
            </label>
            <select
              value={maxValue}
              onChange={(e) => setMaxValue(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={20}>/ 20</option>
              <option value={10}>/ 10</option>
              <option value={100}>/ 100</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Titre (optionnel)
            </label>
            <input
              type="text"
              value={gradeTitle}
              onChange={(e) => setGradeTitle(e.target.value)}
              placeholder="ex: Devoir n°1"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </Card>

      {/* Tableau de saisie */}
      {!selectedClass || !selectedSubject ? (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            Sélectionnez une classe et une matière
          </p>
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500">Aucun élève dans cette classe</p>
        </div>
      ) : (
        <Card padding="sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-700">
              {students.length} élève{students.length > 1 ? 's' : ''}
            </p>
            <Button onClick={handleSaveGrades} isLoading={isSaving} size="md">
              <Save className="w-4 h-4 mr-2" />
              Sauvegarder les notes
            </Button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                  Élève
                </th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                  Note actuelle
                </th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase w-40">
                  Nouvelle note / {maxValue}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {students.map((student: any) => {
                const existingGrade = grades.find(
                  (g) => g.student_id === student.id,
                );
                return (
                  <tr
                    key={student.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <p className="text-sm font-medium text-gray-900">
                        {student.last_name} {student.first_name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {student.student_code}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {existingGrade ? (
                        <span
                          className={cn(
                            'text-sm',
                            getGradeColor(
                              existingGrade.value,
                              existingGrade.max_value,
                            ),
                          )}
                        >
                          {existingGrade.value}/{existingGrade.max_value}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        min="0"
                        max={maxValue}
                        step="0.25"
                        value={gradeValues[student.id] || ''}
                        onChange={(e) =>
                          setGradeValues((prev) => ({
                            ...prev,
                            [student.id]: e.target.value,
                          }))
                        }
                        placeholder="—"
                        className="w-full text-center rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
