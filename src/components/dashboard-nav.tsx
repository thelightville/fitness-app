'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useState } from 'react';
import { Dumbbell, LayoutDashboard, CalendarDays, BarChart3, Menu, X, LogOut, User, TrendingUp, Settings } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export function DashboardNav({ user }: { user: { name?: string | null; email?: string | null; role?: string } }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/appointments', label: 'Appointments', icon: CalendarDays },
  ];

  if (user.role === 'CLIENT') {
    links.push({ href: '/dashboard/measurements', label: 'Progress', icon: TrendingUp });
  }

  if (user.role === 'ADMIN') {
    links.push({ href: '/dashboard/admin', label: 'Admin', icon: BarChart3 });
  }

  links.push({ href: '/dashboard/settings', label: 'Settings', icon: Settings });

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-primary-700"
            >
              <div className="rounded-lg bg-primary-600 p-1.5">
                <Dumbbell className="h-5 w-5 text-white" aria-hidden="true" />
              </div>
              <span>Fitness PT</span>
            </Link>
            <div className="hidden items-center gap-1 md:flex">
              {links.map((link) => {
                const Icon = link.icon;
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                      active
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="hidden items-center gap-4 md:flex">
            <ThemeToggle />
            <div className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
              <User className="h-4 w-4 text-slate-400" aria-hidden="true" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{user.name || user.email}</span>
              <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-bold uppercase text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                {user.role}
              </span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="btn-ghost"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="hidden lg:inline">Sign out</span>
            </button>
          </div>

          <button
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 md:hidden">
          <div className="space-y-1 px-4 py-3">
            {links.map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold ${
                    active
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {link.label}
                </Link>
              );
            })}
            <div className="my-2 border-t border-slate-100 dark:border-slate-700" />
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Theme</span>
              <ThemeToggle />
            </div>
            <div className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 dark:text-slate-300">
              <User className="h-5 w-5" aria-hidden="true" />
              <span>{user.name || user.email}</span>
              <span className="ml-auto rounded-full bg-primary-100 px-2 py-0.5 text-xs font-bold uppercase text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                {user.role}
              </span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <LogOut className="h-5 w-5" aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
