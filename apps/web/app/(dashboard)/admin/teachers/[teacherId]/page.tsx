'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Plus, Trash2, BookOpen,
  Users, Mail, Phone, Calendar,
} from 'lucide-react';
import { academicApi, classApi, subjectApi, academicYearApi } from '@/lib/academic-api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface Assignment {
  id: string;
  class_id: string;
  class_name: string;
  subject_id: string;
  subject_name: string;
  subject_color: string;
  is_main_teacher: boolean;
}

interface Teacher {
  id: string;
  teacher_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  speciality?: string;
  hire_date?: string;
  is_active: boolean;
  assignments?: Assignment[];
}

export default function TeacherDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teacherId = params.teacherId as string;

  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [academicYear, setAcademicYear] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({
    class_id: '',
    subject_id: '',
    is_main_teacher: false,
  });

  useEffect(() => {
    Promise.all([
      academicApi.get(`/teachers/${teacherId}`),
      classApi.getAll(),
      subjectApi.getAll(),
      academicYearApi.getCurrent(),
    ]).then(([teacherRes, classRes, subjectRes, yearRes]) => {
      setTeacher(teacherRes.data.data);
      setClasses(classRes.data.data || []);
      setSubjects(subjectRes.data.data || []);
      setAcademicYear(yearRes.data.data);
    }).finally(() => setIsLoading(false));
  }, [teacherId]);

  const loadTeacher = async () => {
    const res = await academicApi.get(`/teachers/${teacherId}`);
    setTeacher(res.data.data);
  };

  const handleAssign = async () => {
    if (!assignForm.class_id || !assignForm.subject_id || !academicYear) return;
    try {
      await academicApi.post(`/teachers/${teacherId}/assignments`, {
        ...assignForm,
        academic_year_id: academicYear.id,
      });
      await loadTeacher();
      setShowAssignModal(false);
      setAssignForm({ class_id: '', subject_id: '', is_main_teacher: false });
    } catch {
      alert("Erreur lors de l'assignation");
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!confirm('Retirer cette assignation ?')) return;
    try {
      await academicApi.delete(`/teachers/${teacherId}/assignments/${assignmentId}`);
      await loadTeacher();
    } catch {
      alert('Erreur lors de la suppression');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Enseignant introuvable</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {teacher.last_name} {teacher.first_name}
          </h1>
          <p className="text-gray-500 mt-0.5">{teacher.teacher_code}</p>
        </div>
        <span className={cn(
          'px-3 py-1 rounded-full text-sm font-medium',
          teacher.is_active
            ? 'bg-green-100 text-green-700'
            : 'bg-red-100 text-red-700',
        )}>
          {teacher.is_active ? 'Actif' : 'Inactif'}
        </span>
      </div>

      {/* Infos personnelles */}
      <Card className="mb-6">
        <div className="p-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            Informations personnelles
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                <Mail className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm font-medium text-gray-900">
                  {teacher.email}
                </p>
              </div>
            </div>
            {teacher.phone && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
                  <Phone className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Téléphone</p>
                  <p className="text-sm font-medium text-gray-900">
                    {teacher.phone}
                  </p>
                </div>
              </div>
            )}
            {teacher.speciality && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Spécialité</p>
                  <p className="text-sm font-medium text-gray-900">
                    {teacher.speciality}
                  </p>
                </div>
              </div>
            )}
            {teacher.hire_date && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{"Date d'embauche"}</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(teacher.hire_date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Assignations */}
      <Card>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900">
              Classes & Matières assignées
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {teacher.assignments?.length || 0} assignation
              {(teacher.assignments?.length || 0) > 1 ? 's' : ''}
            </p>
          </div>
          <Button onClick={() => setShowAssignModal(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Assigner
          </Button>
        </div>

        {!teacher.assignments?.length ? (
          <div className="text-center py-12">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              Aucune assignation pour cet enseignant
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {teacher.assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
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
                <button
                  onClick={() => handleRemoveAssignment(assignment.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modal assignation */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                Assigner une classe et matière
              </h2>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Classe *
                </label>
                <select
                  value={assignForm.class_id}
                  onChange={(e) => setAssignForm({ ...assignForm, class_id: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner une classe</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Matière *
                </label>
                <select
                  value={assignForm.subject_id}
                  onChange={(e) => setAssignForm({ ...assignForm, subject_id: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner une matière</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_main"
                  checked={assignForm.is_main_teacher}
                  onChange={(e) => setAssignForm({
                    ...assignForm,
                    is_main_teacher: e.target.checked,
                  })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="is_main" className="text-sm text-gray-700">
                  Professeur principal de cette classe
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
              <Button
                variant="secondary"
                onClick={() => setShowAssignModal(false)}
              >
                Annuler
              </Button>
              <Button onClick={handleAssign}>
                Assigner
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}