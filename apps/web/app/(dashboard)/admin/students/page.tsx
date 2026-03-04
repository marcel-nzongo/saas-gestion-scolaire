'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  GraduationCap,
} from 'lucide-react';
import { studentApi, Student } from '@/lib/academic-api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn, getInitials } from '@/lib/utils';

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  graduated: 'bg-blue-100 text-blue-700',
  dropped: 'bg-red-100 text-red-700',
  transferred: 'bg-orange-100 text-orange-700',
};

const statusLabels: Record<string, string> = {
  active: 'Actif',
  graduated: 'Diplômé',
  dropped: 'Abandonné',
  transferred: 'Transféré',
};

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);

  const loadStudents = async (searchTerm = '') => {
    setIsLoading(true);
    try {
      const res = await studentApi.getAll({
        search: searchTerm || undefined,
        limit: 20,
      });
      setStudents(res.data.data);
      setTotal(res.data.meta?.total || 0);
    } catch (error) {
      console.error('Erreur chargement élèves:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadStudents(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer l'élève ${name} ?`)) return;
    try {
      await studentApi.delete(id);
      loadStudents(search);
    } catch {
      alert('Erreur lors de la suppression');
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Élèves</h1>
          <p className="text-gray-500 mt-1">
            {total} élève{total > 1 ? 's' : ''} au total
          </p>
        </div>
        <Button onClick={() => router.push('/admin/students/new')} size="md">
          <Plus className="w-4 h-4 mr-2" />
          Nouvel élève
        </Button>
      </div>

      {/* Barre de recherche */}
      <Card className="mb-6">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, email, code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button variant="secondary" size="md">
            <Filter className="w-4 h-4 mr-2" />
            Filtres
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card padding="sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-16">
            <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Aucun élève trouvé</p>
            <p className="text-gray-400 text-sm mt-1">
              Commencez par ajouter un élève
            </p>
            <Button
              className="mt-4"
              onClick={() => router.push('/admin/students/new')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un élève
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Élève
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Classe
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-bold flex-shrink-0">
                          {student.avatar_url ? (
                            <img
                              src={student.avatar_url}
                              className="w-9 h-9 rounded-full object-cover"
                            />
                          ) : (
                            getInitials(student.first_name, student.last_name)
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {student.first_name} {student.last_name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {student.email || student.phone || '—'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-mono text-gray-600">
                        {student.student_code}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600">
                        {student.class_name || '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={cn(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                          statusColors[student.enrollment_status],
                        )}
                      >
                        {statusLabels[student.enrollment_status]}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() =>
                            router.push(`/admin/students/${student.id}`)
                          }
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Voir"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            router.push(`/admin/students/${student.id}/edit`)
                          }
                          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(
                              student.id,
                              `${student.first_name} ${student.last_name}`,
                            )
                          }
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
