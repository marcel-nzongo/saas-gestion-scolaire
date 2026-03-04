'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Plus, Users, Edit, Trash2, Eye } from 'lucide-react';
import { classApi, Class } from '@/lib/academic-api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function ClassesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadClasses = async () => {
    setIsLoading(true);
    try {
      const res = await classApi.getAll();
      setClasses(res.data.data || []);
    } catch (error) {
      console.error('Erreur chargement classes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer la classe ${name} ?`)) return;
    try {
      await classApi.delete(id);
      loadClasses();
    } catch {
      alert('Erreur lors de la suppression');
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
          <p className="text-gray-500 mt-1">
            {classes.length} classe{classes.length > 1 ? 's' : ''} au total
          </p>
        </div>
        <Button onClick={() => router.push('/admin/classes/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle classe
        </Button>
      </div>

      {/* Grille de classes */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : classes.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucune classe créée</p>
          <Button
            className="mt-4"
            onClick={() => router.push('/admin/classes/new')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Créer une classe
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <Card key={cls.id} className="hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => router.push(`/admin/classes/${cls.id}`)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => router.push(`/admin/classes/${cls.id}/edit`)}
                    className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(cls.id, cls.name)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-bold text-gray-900">{cls.name}</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {cls.academic_year_name || 'Année non définie'}
              </p>

              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5 text-gray-500">
                  <Users className="w-4 h-4" />
                  <span>
                    {cls.student_count || 0} / {cls.max_capacity} élèves
                  </span>
                </div>
                {cls.room && (
                  <span className="text-gray-400 text-xs">📍 {cls.room}</span>
                )}
              </div>

              {cls.teacher_name && (
                <p className="mt-2 text-xs text-gray-400">
                  👤 Prof. principal : {cls.teacher_name}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
