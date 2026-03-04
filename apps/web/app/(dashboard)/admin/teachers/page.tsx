'use client';

import { useState, useEffect } from 'react';
import {
  UserPlus, Search, Edit, Trash2,
  BookOpen, Users, ChevronRight,
} from 'lucide-react';
import { academicApi } from '@/lib/academic-api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface Teacher {
  id: string;
  teacher_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  gender?: string;
  speciality?: string;
  hire_date?: string;
  is_active: boolean;
  assignments?: any[];
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    gender: '',
    speciality: '',
    hire_date: '',
  });

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    setIsLoading(true);
    try {
      const res = await academicApi.get('/teachers');
      setTeachers(res.data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingTeacher) {
        await academicApi.put(`/teachers/${editingTeacher.id}`, form);
      } else {
        await academicApi.post('/teachers', form);
      }
      await loadTeachers();
      setShowModal(false);
      resetForm();
    } catch (error: any) {
      alert(error.response?.data?.error?.code === 'EMAIL_ALREADY_EXISTS'
        ? 'Cet email est déjà utilisé'
        : 'Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setForm({
      first_name: teacher.first_name,
      last_name: teacher.last_name,
      email: teacher.email,
      phone: teacher.phone || '',
      gender: teacher.gender || '',
      speciality: teacher.speciality || '',
      hire_date: teacher.hire_date || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet enseignant ?')) return;
    try {
      await academicApi.delete(`/teachers/${id}`);
      await loadTeachers();
    } catch (error) {
      alert('Erreur lors de la suppression');
    }
  };

  const resetForm = () => {
    setEditingTeacher(null);
    setForm({
      first_name: '', last_name: '', email: '',
      phone: '', gender: '', speciality: '', hire_date: '',
    });
  };

  const filtered = teachers.filter((t) =>
    `${t.first_name} ${t.last_name} ${t.email} ${t.teacher_code}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <div className="p-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enseignants</h1>
          <p className="text-gray-500 mt-1">
            {teachers.length} enseignant{teachers.length > 1 ? 's' : ''} enregistré
            {teachers.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowModal(true); }}>
          <UserPlus className="w-4 h-4 mr-2" />
          Nouvel enseignant
        </Button>
      </div>

      {/* Recherche */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher un enseignant..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Liste */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucun enseignant trouvé</p>
          <p className="text-gray-400 text-sm mt-1">
            Cliquez sur "Nouvel enseignant" pour commencer
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((teacher) => (
            <Card key={teacher.id} padding="sm">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-lg">
                    {teacher.first_name[0]}{teacher.last_name[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">
                        {teacher.last_name} {teacher.first_name}
                      </p>
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        {teacher.teacher_code}
                      </span>
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded-full',
                        teacher.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700',
                      )}>
                        {teacher.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{teacher.email}</p>
                    {teacher.speciality && (
                      <p className="text-xs text-blue-600 mt-0.5">
                        {teacher.speciality}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(teacher)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(teacher.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => window.location.href = `/admin/teachers/${teacher.id}`}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal création/édition */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingTeacher ? 'Modifier l\'enseignant' : 'Nouvel enseignant'}
              </h2>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Prénom"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Nom *
                  </label>
                  <input
                    type="text"
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nom"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="email@ecole.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+221 77 000 00 00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Genre
                  </label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner</option>
                    <option value="male">Masculin</option>
                    <option value="female">Féminin</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Spécialité
                  </label>
                  <input
                    type="text"
                    value={form.speciality}
                    onChange={(e) => setForm({ ...form, speciality: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ex: Mathématiques"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Date d'embauche
                  </label>
                  <input
                    type="date"
                    value={form.hire_date}
                    onChange={(e) => setForm({ ...form, hire_date: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              {!editingTeacher && (
                <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
                  💡 Mot de passe par défaut : <strong>Password123</strong>
                  — L'enseignant devra le changer à la première connexion.
                </p>
              )}
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
              <Button
                variant="secondary"
                onClick={() => { setShowModal(false); resetForm(); }}
              >
                Annuler
              </Button>
              <Button onClick={handleSubmit}>
                {editingTeacher ? 'Modifier' : 'Créer l\'enseignant'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}