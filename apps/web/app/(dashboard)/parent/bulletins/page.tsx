'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, CalendarDays, Award, TrendingUp, Trophy } from 'lucide-react';
import { academicApi, academicYearApi } from '@/lib/academic-api';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export default function ParentBulletinsPage() {
  const [parentData, setParentData] = useState<any>(null);
  const [academicYear, setAcademicYear] = useState<any>(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedTrimester, setSelectedTrimester] = useState('1');
  const [bulletinData, setBulletinData] = useState<any>(null);
  const [annualData, setAnnualData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      academicApi.get('/parents/me'),
      academicYearApi.getCurrent(),
    ]).then(([parentRes, yearRes]) => {
      setParentData(parentRes.data.data);
      setAcademicYear(yearRes.data.data);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedStudentId || !academicYear) return;
    setLoading(true);
    setBulletinData(null);
    setAnnualData(null);
    Promise.all([
      academicApi.get(`/bulletins/${selectedStudentId}/data?academic_year_id=${academicYear.id}&trimester=${selectedTrimester}`),
      academicApi.get(`/bulletins/${selectedStudentId}/data-annual?academic_year_id=${academicYear.id}`),
    ]).then(([triRes, annualRes]) => {
      setBulletinData(triRes.data.data);
      setAnnualData(annualRes.data.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedStudentId, selectedTrimester, academicYear]);

  const getToken = () =>
    localStorage.getItem('access_token') ||
    document.cookie.split('access_token=')[1]?.split(';')[0];

  const handleDownloadTri = async () => {
    if (!academicYear || !selectedStudentId) return;
    setGenerating('tri');
    try {
      const student = parentData?.students?.find((s: any) => s.id === selectedStudentId);
      const name = `${student?.last_name}_${student?.first_name}`;
      const response = await fetch(
        `http://localhost:3002/api/v1/bulletins/${selectedStudentId}/pdf?academic_year_id=${academicYear.id}&trimester=${selectedTrimester}`,
        { headers: { Authorization: `Bearer ${getToken()}`, 'x-tenant-id': 'test' } },
      );
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bulletin_${name}_T${selectedTrimester}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Erreur lors de la génération du bulletin');
    } finally {
      setGenerating(null);
    }
  };

  const handleDownloadAnnual = async () => {
    if (!academicYear || !selectedStudentId) return;
    setGenerating('annual');
    try {
      const student = parentData?.students?.find((s: any) => s.id === selectedStudentId);
      const name = `${student?.last_name}_${student?.first_name}`;
      const response = await fetch(
        `http://localhost:3002/api/v1/bulletins/${selectedStudentId}/annual-pdf?academic_year_id=${academicYear.id}`,
        { headers: { Authorization: `Bearer ${getToken()}`, 'x-tenant-id': 'test' } },
      );
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bulletin_annuel_${name}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Erreur lors de la génération du bulletin annuel');
    } finally {
      setGenerating(null);
    }
  };

  const getMentionColor = (avg: number | null) => {
    if (avg === null) return 'text-gray-400';
    if (avg >= 16) return 'text-emerald-600';
    if (avg >= 14) return 'text-green-600';
    if (avg >= 12) return 'text-blue-600';
    if (avg >= 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMentionBg = (avg: number | null) => {
    if (avg === null) return 'bg-gray-50 border-gray-200';
    if (avg >= 14) return 'bg-green-50 border-green-200';
    if (avg >= 10) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getRankColor = (rank: number | null) => {
    if (!rank) return 'text-gray-400';
    if (rank === 1) return 'text-yellow-600';
    if (rank <= 3) return 'text-green-600';
    return 'text-blue-600';
  };

  const getRankLabel = (ranking: any) => {
    if (!ranking?.rank) return '—';
    const suffix = ranking.rank === 1 ? 'er' : 'ème';
    return `${ranking.rank}${suffix} / ${ranking.total}`;
  };

  const fmt = (v: number | null) => v !== null ? v.toFixed(2) : '—';

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Bulletins de notes</h1>
        <p className="text-gray-500 mt-1">Consultez et téléchargez les bulletins de vos enfants</p>
      </div>

      {/* Sélection enfant + trimestre */}
      <Card className="mb-6">
        <div className="flex gap-4 p-4 flex-wrap">
          <div className="flex-1 min-w-48">
            <label className="block text-xs font-medium text-gray-500 mb-1">Enfant</label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">-- Choisir un enfant --</option>
              {parentData?.students?.map((s: any) => (
                <option key={s.id} value={s.id}>{s.last_name} {s.first_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Trimestre</label>
            <select
              value={selectedTrimester}
              onChange={(e) => setSelectedTrimester(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="1">1er Trimestre</option>
              <option value="2">2ème Trimestre</option>
              <option value="3">3ème Trimestre</option>
            </select>
          </div>
        </div>
      </Card>

      {!selectedStudentId ? (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Sélectionnez un enfant pour voir ses bulletins</p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
        </div>
      ) : bulletinData ? (
        <>
          {/* Infos élève */}
          <div className={cn('rounded-xl p-4 mb-6 border flex items-center justify-between', getMentionBg(bulletinData.generalAverage))}>
            <div>
              <p className="font-semibold text-gray-900">
                {bulletinData.student.last_name} {bulletinData.student.first_name}
              </p>
              <p className="text-sm text-gray-500">
                {bulletinData.student.class_name} · {bulletinData.academicYear?.name}
              </p>
            </div>
            <div className="text-right">
              <p className={cn('text-3xl font-black', getMentionColor(bulletinData.generalAverage))}>
                {fmt(bulletinData.generalAverage)}
              </p>
              <p className="text-xs text-gray-500">Moyenne T{selectedTrimester}</p>
            </div>
          </div>

          {/* 4 cartes : moyenne tri + classement tri + annuelle + classement annuel */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className={cn('rounded-xl p-4 border text-center', getMentionBg(bulletinData.generalAverage))}>
              <p className="text-xs text-gray-500 font-medium mb-1">Moy. T{selectedTrimester}</p>
              <p className={cn('text-2xl font-black', getMentionColor(bulletinData.generalAverage))}>{fmt(bulletinData.generalAverage)}</p>
              <p className="text-xs text-gray-400 mt-1">{bulletinData.mention}</p>
            </div>
            <div className="rounded-xl p-4 border bg-purple-50 border-purple-200 text-center">
              <p className="text-xs text-gray-500 font-medium mb-1">Classement T{selectedTrimester}</p>
              <p className={cn('text-2xl font-black', getRankColor(bulletinData.ranking?.rank))}>
                {getRankLabel(bulletinData.ranking)}
              </p>
              <p className="text-xs text-gray-400 mt-1">dans la classe</p>
            </div>
            {annualData && <>
              <div className={cn('rounded-xl p-4 border text-center', getMentionBg(annualData.avgAnnual))}>
                <p className="text-xs text-gray-500 font-medium mb-1">Moy. Annuelle</p>
                <p className={cn('text-2xl font-black', getMentionColor(annualData.avgAnnual))}>{fmt(annualData.avgAnnual)}</p>
                <p className="text-xs text-gray-400 mt-1">{annualData.mentionAnnual}</p>
              </div>
              <div className="rounded-xl p-4 border bg-yellow-50 border-yellow-200 text-center">
                <p className="text-xs text-gray-500 font-medium mb-1">Classement Annuel</p>
                <p className={cn('text-2xl font-black', getRankColor(annualData.ranking?.rank))}>
                  {getRankLabel(annualData.ranking)}
                </p>
                <p className="text-xs text-gray-400 mt-1">dans la classe</p>
              </div>
            </>}
          </div>

          {/* Résumé trimestriel T1/T2/T3 */}
          {annualData && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: '1er Trim.', value: annualData.avgT1, color: 'text-sky-600', bg: 'bg-sky-50 border-sky-200' },
                { label: '2ème Trim.', value: annualData.avgT2, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
                { label: '3ème Trim.', value: annualData.avgT3, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
              ].map((item) => (
                <div key={item.label} className={cn('rounded-xl p-3 border text-center', item.bg)}>
                  <p className="text-xs text-gray-500 font-medium mb-1">{item.label}</p>
                  <p className={cn('text-xl font-black', item.color)}>{fmt(item.value)}</p>
                </div>
              ))}
            </div>
          )}

          {/* Tableau des matières */}
          <Card className="mb-6">
            <div className="p-4 border-b border-gray-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <h2 className="font-semibold text-gray-900">
                Notes du {['1er', '2ème', '3ème'][parseInt(selectedTrimester) - 1]} Trimestre
              </h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Matière</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Coeff.</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Moyenne</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Appréciation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bulletinData.subjects.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-8 text-gray-400 text-sm">Aucune note enregistrée</td></tr>
                ) : bulletinData.subjects.map((s: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{s.subject_name}</td>
                    <td className="py-3 px-4 text-center text-sm text-gray-500">{s.coefficient}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={cn('text-sm font-bold', getMentionColor(s.average))}>
                        {s.average !== null ? s.average.toFixed(2) : '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500 italic">{s.comment || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Mention + Absences + Classement */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className={cn('rounded-xl p-4 border flex items-center gap-3', getMentionBg(bulletinData.generalAverage))}>
              <Award className={cn('w-8 h-8', getMentionColor(bulletinData.generalAverage))} />
              <div>
                <p className="text-xs text-gray-500 font-medium">Mention T{selectedTrimester}</p>
                <p className={cn('text-lg font-bold', getMentionColor(bulletinData.generalAverage))}>{bulletinData.mention}</p>
              </div>
            </div>
            <div className="rounded-xl p-4 border bg-purple-50 border-purple-200 flex items-center gap-3">
              <Trophy className={cn('w-8 h-8', getRankColor(bulletinData.ranking?.rank))} />
              <div>
                <p className="text-xs text-gray-500 font-medium">Classement T{selectedTrimester}</p>
                <p className={cn('text-lg font-bold', getRankColor(bulletinData.ranking?.rank))}>
                  {getRankLabel(bulletinData.ranking)}
                </p>
              </div>
            </div>
            <div className="rounded-xl p-4 border bg-gray-50 border-gray-200 flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-600 font-bold text-sm">{bulletinData.totalAbsences}</span>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Absences</p>
                <p className="text-lg font-bold text-gray-700">
                  {bulletinData.totalAbsences} absence{bulletinData.totalAbsences > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Boutons téléchargement */}
          <div className="flex gap-3">
            <button
              onClick={handleDownloadTri}
              disabled={!!generating}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {generating === 'tri' ? (
                <><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />Génération...</>
              ) : (
                <><Download className="w-4 h-4" />Bulletin T{selectedTrimester} (PDF)</>
              )}
            </button>
            <button
              onClick={handleDownloadAnnual}
              disabled={!!generating}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50"
            >
              {generating === 'annual' ? (
                <><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />Génération...</>
              ) : (
                <><CalendarDays className="w-4 h-4" />Bulletin Annuel (PDF)</>
              )}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
