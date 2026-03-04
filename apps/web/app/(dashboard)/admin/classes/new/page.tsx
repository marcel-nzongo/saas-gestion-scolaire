'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, BookPlus } from 'lucide-react';
import { classApi, academicYearApi, AcademicYear } from '@/lib/academic-api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';

const schema = z.object({
  name: z.string().min(1, 'Nom de classe requis'),
  academic_year_id: z.string().min(1, 'Année scolaire requise'),
  level: z.string().optional(),
  section: z.string().optional(),
  max_capacity: z.number().min(1).max(100).optional(),
  room: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewClassPage() {
  const router = useRouter();
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { max_capacity: 40 },
  });

  useEffect(() => {
    academicYearApi.getAll().then((res) => {
      setAcademicYears(res.data.data || []);
    });
  }, []);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError('');
    try {
      await classApi.create(data);
      router.push('/admin/classes');
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message || 'Erreur lors de la création',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nouvelle classe</h1>
          <p className="text-gray-500 mt-0.5">
            Remplissez les informations de la classe
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations de la classe</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input
                label="Nom de la classe *"
                placeholder="ex: 6ème A, Terminale S"
                error={errors.name?.message}
                {...register('name')}
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Année scolaire *
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('academic_year_id')}
              >
                <option value="">Sélectionner une année</option>
                {academicYears.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.name}
                    {year.is_current ? ' (Courante)' : ''}
                  </option>
                ))}
              </select>
              {errors.academic_year_id && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.academic_year_id.message}
                </p>
              )}
            </div>

            <Input
              label="Niveau"
              placeholder="ex: 6ème, Terminale"
              {...register('level')}
            />
            <Input
              label="Section"
              placeholder="ex: A, B, S"
              {...register('section')}
            />
            <Input
              label="Capacité max"
              type="number"
              placeholder="40"
              {...register('max_capacity', { valueAsNumber: true })}
            />
            <Input
              label="Salle"
              placeholder="ex: Salle 01"
              {...register('room')}
            />
          </div>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
          >
            Annuler
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            <BookPlus className="w-4 h-4 mr-2" />
            Créer la classe
          </Button>
        </div>
      </form>
    </div>
  );
}
