'use client';

import {
  Users,
  BookOpen,
  CreditCard,
  TrendingUp,
  Bell,
  Calendar,
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuthStore } from '@/store/auth.store';

const stats = [
  {
    title: 'Total Élèves',
    value: '342',
    change: '+12 ce mois',
    icon: Users,
    bg: 'bg-blue-50',
    text: 'text-blue-600',
  },
  {
    title: 'Classes actives',
    value: '18',
    change: 'Année 2025-2026',
    icon: BookOpen,
    bg: 'bg-green-50',
    text: 'text-green-600',
  },
  {
    title: 'Frais collectés',
    value: '4 250 000',
    change: 'FCFA ce mois',
    icon: CreditCard,
    bg: 'bg-purple-50',
    text: 'text-purple-600',
  },
  {
    title: 'Taux de présence',
    value: '94%',
    change: '+2% vs mois dernier',
    icon: TrendingUp,
    bg: 'bg-orange-50',
    text: 'text-orange-600',
  },
];

const activities = [
  { text: 'Notes du 1er trimestre publiées - 6ème A', time: 'Il y a 2h' },
  { text: 'Nouveau paiement reçu - Mamadou Diallo', time: 'Il y a 3h' },
  { text: '3 absences signalées - 3ème B', time: 'Il y a 5h' },
  { text: 'Bulletin généré - Fatou Ndiaye', time: 'Hier' },
  { text: 'Nouvel élève inscrit - Ibrahima Fall', time: 'Hier' },
];

export default function AdminDashboard() {
  const { user } = useAuthStore();

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Bonjour, {user?.first_name} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          Voici un aperçu de votre établissement
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <div
              className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center mb-4`}
            >
              <stat.icon className={`w-6 h-6 ${stat.text}`} />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm font-medium text-gray-600 mt-1">
              {stat.title}
            </p>
            <p className={`text-xs mt-1 ${stat.text}`}>{stat.change}</p>
          </Card>
        ))}
      </div>

      {/* Activités + Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Activités récentes</CardTitle>
                <span className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">
                  Voir tout
                </span>
              </div>
            </CardHeader>
            <div className="space-y-1">
              {activities.map((activity, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0"
                >
                  <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bell className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">{activity.text}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Année scolaire</CardTitle>
            </CardHeader>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Année</span>
                <span className="font-medium">2025 - 2026</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Trimestre</span>
                <span className="font-medium text-blue-600">1er trimestre</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Fin</span>
                <span className="font-medium">20 Déc 2025</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: '65%' }}
                />
              </div>
              <p className="text-xs text-gray-400">65% du trimestre écoulé</p>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                <CardTitle>Prochain événement</CardTitle>
              </div>
            </CardHeader>
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-900">
                Conseil de classe
              </p>
              <p className="text-xs text-blue-600 mt-1">15 Nov 2025 — 14h00</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
