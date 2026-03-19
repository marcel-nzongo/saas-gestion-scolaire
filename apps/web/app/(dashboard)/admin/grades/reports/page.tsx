'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, CalendarDays } from 'lucide-react';
import { Search } from 'lucide-react';
import { academicApi, academicYearApi } from '@/lib/academic-api';
import { Card } from '@/components/ui/Card';

export default function BulletinsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [academicYear, setAcademicYear] = useState<any>(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTrimester, setSelectedTrimester] = useState('1');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      academicYearApi.getCurrent(),
      academicApi.get('/classes'),
      academicApi.get('/students'),
    ]).then(([yearRes, classRes, studentsRes]) => {
      setAcademicYear(yearRes.data.data);
      setClasses(classRes.data.data || []);
      setStudents(studentsRes.data.data || []);
    });
  }, []);

  useEffect(() => {
    if (!academicYear) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedClass) params.append('class_id', selectedClass);
    academicApi
      .get(`/students?${params}`)
      .then((res) => setStudents(res.data.data || []))
      .finally(() => setLoading(false));
  }, [selectedClass, academicYear]);

  const getToken = () =>
    localStorage.getItem('access_token') ||
    document.cookie.split('access_token=')[1]?.split(';')[0];

  const handleDownload = async (studentId: string, studentName: string) => {
    if (!academicYear) return;
    setGenerating(studentId + '-tri');
    try {
      const response = await fetch(
        `http://localhost:3002/api/v1/bulletins/${studentId}/pdf?academic_year_id=${academicYear.id}&trimester=${selectedTrimester}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
            'x-tenant-id': 'test',
          },
        },
      );
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bulletin_${studentName.replace(/\s+/g, '_')}_T${selectedTrimester}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Erreur lors de la génération du bulletin');
    } finally {
      setGenerating(null);
    }
  };

  const handleDownloadAnnual = async (
    studentId: string,
    studentName: string,
  ) => {
    if (!academicYear) return;
    setGenerating(studentId + '-annual');
    try {
      const response = await fetch(
        `http://localhost:3002/api/v1/bulletins/${studentId}/annual-pdf?academic_year_id=${academicYear.id}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
            'x-tenant-id': 'test',
          },
        },
      );
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bulletin_annuel_${studentName.replace(/\s+/g, '_')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Erreur lors de la génération du bulletin annuel');
    } finally {
      setGenerating(null);
    }
  };

  const filteredStudents = students.filter((s) =>
    `${s.first_name} ${s.last_name} ${s.student_code}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Bulletins de notes</h1>
        <p className="text-gray-500 mt-1">{academicYear?.name}</p>
      </div>

      {/* Filtres */}
      <Card className="mb-6">
        <div className="flex gap-4 p-4 flex-wrap">
          <div className="flex-1 relative min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un élève..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Toutes les classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={selectedTrimester}
            onChange={(e) => setSelectedTrimester(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1">1er Trimestre</option>
            <option value="2">2ème Trimestre</option>
            <option value="3">3ème Trimestre</option>
          </select>
        </div>
      </Card>

      {/* Liste élèves */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucun élève trouvé</p>
        </div>
      ) : (
        <Card padding="sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                  Élève
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                  Classe
                </th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                  Trimestre
                </th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredStudents.map((s) => {
                const name = `${s.last_name}_${s.first_name}`;
                const isGenTri = generating === s.id + '-tri';
                const isGenAnnual = generating === s.id + '-annual';
                return (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">
                          {s.last_name?.[0]}
                          {s.first_name?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {s.last_name} {s.first_name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {s.student_code}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-gray-600">
                        {s.class_name || '—'}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm font-medium text-blue-600">
                        T{selectedTrimester}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* Bulletin trimestriel */}
                        <button
                          onClick={() => handleDownload(s.id, name)}
                          disabled={!!generating}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          {isGenTri ? (
                            <>
                              <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                              Génération...
                            </>
                          ) : (
                            <>
                              <Download className="w-3 h-3" />
                              Trimestre
                            </>
                          )}
                        </button>
                        {/* Bulletin annuel */}
                        <button
                          onClick={() => handleDownloadAnnual(s.id, name)}
                          disabled={!!generating}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50"
                        >
                          {isGenAnnual ? (
                            <>
                              <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                              Génération...
                            </>
                          ) : (
                            <>
                              <CalendarDays className="w-3 h-3" />
                              Annuel
                            </>
                          )}
                        </button>
                      </div>
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
