'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Upload, FileText, Video, Trash2,
  BookOpen, Filter, Plus,
} from 'lucide-react';
import { academicApi, academicYearApi } from '@/lib/academic-api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export default function TeacherResourcesPage() {
  const [teacherData, setTeacherData] = useState<any>(null);
  const [academicYear, setAcademicYear] = useState<any>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    class_id: '',
    subject_id: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    Promise.all([
      academicApi.get('/teachers/me'),
      academicYearApi.getCurrent(),
    ]).then(([teacherRes, yearRes]) => {
      setTeacherData(teacherRes.data.data);
      setAcademicYear(yearRes.data.data);
    });
  }, []);

  const availableClasses = teacherData?.assignments
    ? [...new Map(
        teacherData.assignments.map((a: any) => [a.class_id, {
          id: a.class_id,
          name: a.class_name,
        }])
      ).values()]
    : [];

  const availableSubjects = (classId: string) => teacherData?.assignments
    ? teacherData.assignments
        .filter((a: any) => a.class_id === classId)
        .map((a: any) => ({ id: a.subject_id, name: a.subject_name }))
    : [];

  const loadResources = async () => {
    if (!academicYear) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        academic_year_id: academicYear.id,
        ...(selectedClassId && { class_id: selectedClassId }),
        ...(selectedSubjectId && { subject_id: selectedSubjectId }),
      });
      const res = await academicApi.get(`/resources?${params}`);
      setResources(res.data.data || []);
    } catch {
      console.error('Erreur chargement ressources');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (academicYear) loadResources();
  }, [academicYear, selectedClassId, selectedSubjectId]);

  const handleUpload = async () => {
    if (!selectedFile || !form.title || !form.class_id || !form.subject_id) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('class_id', form.class_id);
      formData.append('subject_id', form.subject_id);
      formData.append('academic_year_id', academicYear.id);

      await academicApi.post('/resources/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      await loadResources();
      setShowModal(false);
      setSelectedFile(null);
      setForm({ title: '', description: '', class_id: '', subject_id: '' });
    } catch {
      alert("Erreur lors de l'upload");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette ressource ?')) return;
    try {
      await academicApi.delete(`/resources/${id}`);
      await loadResources();
    } catch {
      alert('Erreur lors de la suppression');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  return (
    <div className="p-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Ressources pédagogiques
          </h1>
          <p className="text-gray-500 mt-1">
            Partagez vos cours et documents avec vos élèves
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Ajouter une ressource
        </Button>
      </div>

      {/* Filtres */}
      <Card className="mb-6">
        <div className="flex gap-4 items-end p-4">
          <div className="flex items-center gap-2 text-gray-500">
            <Filter className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Classe
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setSelectedSubjectId('');
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Toutes les classes</option>
              {(availableClasses as any[]).map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Matière
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              disabled={!selectedClassId}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="">Toutes les matières</option>
              {availableSubjects(selectedClassId).map((sub: any) => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Liste ressources */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : resources.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucune ressource</p>
          <p className="text-gray-400 text-sm mt-1">
            Cliquez sur "Ajouter une ressource" pour commencer
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {resources.map((resource) => (
            <Card key={resource.id} padding="sm">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center',
                    resource.type === 'pdf'
                      ? 'bg-red-50'
                      : 'bg-blue-50',
                  )}>
                    {resource.type === 'pdf'
                      ? <FileText className="w-6 h-6 text-red-500" />
                      : <Video className="w-6 h-6 text-blue-500" />
                    }
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {resource.title}
                    </p>
                    {resource.description && (
                      <p className="text-sm text-gray-500 mt-0.5">
                        {resource.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-400">
                        {resource.class_name}
                      </span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-400">
                        {resource.subject_name}
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
                <div className="flex items-center gap-2">
                  
                <a href={`http://localhost:3002${resource.file_url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {'Ouvrir'}
                  </a>
                  <button
                    onClick={() => handleDelete(resource.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal upload */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                Ajouter une ressource
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Titre *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ex: Cours chapitre 1"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Description optionnelle..."
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Classe *
                  </label>
                  <select
                    value={form.class_id}
                    onChange={(e) => setForm({
                      ...form,
                      class_id: e.target.value,
                      subject_id: '',
                    })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner</option>
                    {(availableClasses as any[]).map((cls) => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Matière *
                  </label>
                  <select
                    value={form.subject_id}
                    onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
                    disabled={!form.class_id}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <option value="">Sélectionner</option>
                    {availableSubjects(form.class_id).map((sub: any) => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Zone upload */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Fichier * (PDF ou vidéo, max 500Mo)
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors',
                    selectedFile
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50',
                  )}
                >
                  {selectedFile ? (
                    <div>
                      <div className="flex items-center justify-center gap-2 mb-1">
                        {selectedFile.type === 'application/pdf'
                          ? <FileText className="w-6 h-6 text-red-500" />
                          : <Video className="w-6 h-6 text-blue-500" />
                        }
                        <span className="text-sm font-medium text-gray-900">
                          {selectedFile.name}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        Cliquez pour sélectionner un fichier
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        PDF, MP4, WebM, MOV
                      </p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,video/*"
                  className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
              <Button
                variant="secondary"
                onClick={() => setShowModal(false)}
              >
                Annuler
              </Button>
              <Button onClick={handleUpload} isLoading={isUploading}>
                <Upload className="w-4 h-4 mr-2" />
                Uploader
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}