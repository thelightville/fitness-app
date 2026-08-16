'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Dumbbell, MapPin, BarChart3, Shield } from 'lucide-react';

const links = [
  { href: '/dashboard/admin', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/admin/clients', label: 'Clients', icon: Users },
  { href: '/dashboard/admin/trainers', label: 'Trainers', icon: Dumbbell },
  { href: '/dashboard/admin/gyms', label: 'Gyms', icon: MapPin },
  { href: '/dashboard/admin/admins', label: 'Admins', icon: Shield },
];

export function AdminSubNav() {
  const pathname = usePathname();

  return (
    <div className="border-b border-slate-200 dark:border-slate-700">
      <nav className="-mb-px flex gap-6 overflow-x-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`group inline-flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-semibold transition-colors ${
                active
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-slate-500 hover:border-primary-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400'
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
