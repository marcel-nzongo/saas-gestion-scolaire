'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { studentApi, classApi, Class } from '@/lib/academic-api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';

const schema = z.object({
  first_name: z.string().min(2, 'Prénom requis'),
  last_name: z.string().min(2, 'Nom requis'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  phone: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  date_of_birth: z.string().optional(),
  class_id: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewStudentPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    classApi.getAll().then((res) => setClasses(res.data.data || []));
  }, []);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError('');
    try {
      await studentApi.create(data);
      router.push('/admin/students');
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
          <h1 className="text-2xl font-bold text-gray-900">Nouvel élève</h1>
          <p className="text-gray-500 mt-0.5">
            Remplissez les informations de l'élève
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Infos personnelles */}
        <Card>
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Prénom *"
              placeholder="Mamadou"
              error={errors.first_name?.message}
              {...register('first_name')}
            />
            <Input
              label="Nom *"
              placeholder="Diallo"
              error={errors.last_name?.message}
              {...register('last_name')}
            />
            <Input
              label="Email"
              type="email"
              placeholder="mamadou@email.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Téléphone"
              placeholder="+221 77 000 00 00"
              {...register('phone')}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Genre
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('gender')}
              >
                <option value="">Sélectionner</option>
                <option value="male">Masculin</option>
                <option value="female">Féminin</option>
                <option value="other">Autre</option>
              </select>
            </div>
            <Input
              label="Date de naissance"
              type="date"
              {...register('date_of_birth')}
            />
          </div>
        </Card>

        {/* Scolarité */}
        <Card>
          <CardHeader>
            <CardTitle>Scolarité</CardTitle>
          </CardHeader>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Classe
            </label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register('class_id')}
            >
              <option value="">Sans classe pour l'instant</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                  {cls.academic_year_name ? ` — ${cls.academic_year_name}` : ''}
                </option>
              ))}
            </select>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
          >
            Annuler
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            <UserPlus className="w-4 h-4 mr-2" />
            Créer l'élève
          </Button>
        </div>
      </form>
    </div>
  );
}
