'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Plus, Trash2,
  Mail, Phone, Users,
} from 'lucide-react';
import { academicApi } from '@/lib/academic-api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export default function ParentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const parentId = params.parentId as string;

  const [parent, setParent] = useState<any>(null);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkForm, setLinkForm] = useState({
    student_id: '',
    relationship: 'parent',
    is_primary: false,
  });

  useEffect(() => {
    Promise.all([
      academicApi.get(`/parents/${parentId}`),
      academicApi.get('/students'),
    ]).then(([parentRes, studentsRes]) => {
      setParent(parentRes.data.data);
      setAllStudents(studentsRes.data.data || []);
    }).finally(() => setIsLoading(false));
  }, [parentId]);

  const loadParent = async () => {
    const res = await academicApi.get(`/parents/${parentId}`);
    setParent(res.data.data);
  };

  const handleLink = async () => {
    if (!linkForm.student_id) return;
    try {
      await academicApi.post(`/parents/${parentId}/students`, linkForm);
      await loadParent();
      setShowLinkModal(false);
      setLinkForm({ student_id: '', relationship: 'parent', is_primary: false });
    } catch {
      alert("Erreur lors du lien");
    }
  };

  const handleUnlink = async (studentId: string) => {
    if (!confirm('Retirer cet élève ?')) return;
    try {
      await academicApi.delete(`/parents/${parentId}/students/${studentId}`);
      await loadParent();
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

  if (!parent) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Parent introuvable</p>
      </div>
    );
  }

  const linkedStudentIds = parent.students?.map((s: any) => s.id) || [];
  const availableStudents = allStudents.filter(
    (s) => !linkedStudentIds.includes(s.id)
  );

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
            {parent.last_name} {parent.first_name}
          </h1>
          <p className="text-gray-500 mt-0.5">{parent.parent_code}</p>
        </div>
        <span className={cn(
          'px-3 py-1 rounded-full text-sm font-medium',
          parent.is_active
            ? 'bg-green-100 text-green-700'
            : 'bg-red-100 text-red-700',
        )}>
          {parent.is_active ? 'Actif' : 'Inactif'}
        </span>
      </div>

      {/* Infos */}
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
                <p className="text-sm font-medium text-gray-900">{parent.email}</p>
              </div>
            </div>
            {parent.phone && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
                  <Phone className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Téléphone</p>
                  <p className="text-sm font-medium text-gray-900">{parent.phone}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Enfants */}
      <Card>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900">Enfants liés</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {parent.students?.length || 0} enfant
              {(parent.students?.length || 0) > 1 ? 's' : ''}
            </p>
          </div>
          <Button onClick={() => setShowLinkModal(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Lier un élève
          </Button>
        </div>

        {!parent.students?.length ? (
          <div className="text-center py-12">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Aucun enfant lié</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {parent.students.map((student: any) => (
              <div
                key={student.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
                    {student.first_name[0]}{student.last_name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {student.last_name} {student.first_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {student.class_name} · {student.student_code}
                      {student.is_primary && (
                        <span className="ml-2 text-green-600 font-medium">
                          · Contact principal
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleUnlink(student.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modal lier élève */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                Lier un élève
              </h2>
              <button
                onClick={() => setShowLinkModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Élève *
                </label>
                <select
                  value={linkForm.student_id}
                  onChange={(e) => setLinkForm({ ...linkForm, student_id: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner un élève</option>
                  {availableStudents.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.last_name} {s.first_name} — {s.class_name || 'Sans classe'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Lien de parenté
                </label>
                <select
                  value={linkForm.relationship}
                  onChange={(e) => setLinkForm({ ...linkForm, relationship: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="parent">Parent</option>
                  <option value="father">Père</option>
                  <option value="mother">Mère</option>
                  <option value="guardian">Tuteur</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_primary"
                  checked={linkForm.is_primary}
                  onChange={(e) => setLinkForm({ ...linkForm, is_primary: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="is_primary" className="text-sm text-gray-700">
                  Contact principal
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
              <Button variant="secondary" onClick={() => setShowLinkModal(false)}>
                Annuler
              </Button>
              <Button onClick={handleLink}>
                Lier
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}