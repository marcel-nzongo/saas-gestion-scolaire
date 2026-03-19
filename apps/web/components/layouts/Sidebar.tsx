'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  LayoutDashboard,
  Users,
  BookOpen,
  Settings,
  LogOut,
  GraduationCap,
  ChevronRight,
  ClipboardList,
  FileText,
  Bell,
  Clock,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { Shield } from 'lucide-react';

const menuItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Tableau de bord' },
  { href: '/admin/students', icon: Users, label: 'Élèves' },
  { href: '/admin/classes', icon: BookOpen, label: 'Classes' },
  { href: '/admin/teachers', icon: GraduationCap, label: 'Enseignants' },
  { href: '/admin/parents', icon: Users, label: 'Parents' },
  { href: '/admin/grades', icon: ClipboardList, label: 'Notes' },
  { href: '/admin/grades/reports', icon: FileText, label: 'Bulletins' },
  { href: '/admin/timetable', icon: Calendar, label: 'Emploi du temps' },
  { href: '/admin/attendance', icon: Clock, label: 'Absences & Retards' },
  { href: '/admin/finance', icon: DollarSign, label: 'Finance' },
  { href: '/admin/notifications', icon: Bell, label: 'Notifications' },
  { href: '/admin/settings', icon: Settings, label: 'Paramètres' },
  { href: '/admin/discipline', icon: Shield, label: 'Discipline' },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  return (
    <aside className="w-64 h-screen bg-gray-900 flex flex-col fixed left-0 top-0">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-none">
              EduCore
            </h1>
            <p className="text-gray-400 text-xs mt-0.5">Gestion scolaire</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/admin' &&
              pathname.startsWith(item.href + '/') &&
              !menuItems.some(
                (other) =>
                  other.href !== item.href &&
                  other.href.startsWith(item.href + '/') &&
                  pathname.startsWith(other.href),
              ));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white',
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="w-4 h-4 opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* Profil utilisateur */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {user ? getInitials(user.first_name, user.last_name) : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-gray-400 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
};
