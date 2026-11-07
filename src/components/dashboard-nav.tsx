'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useState } from 'react';
import { Dumbbell, LayoutDashboard, CalendarDays, BarChart3, Menu, X, LogOut, User, TrendingUp, Settings, Sparkles } from 'lucide-react';
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
    <nav className="sticky top-0 z-50 border-b border-brand-line bg-brand-paper/92 backdrop-blur-md dark:border-white/10 dark:bg-ink-900/95">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 font-display text-xl font-black tracking-normal text-ink-900 dark:text-primary-200"
            >
              <div className="rounded-lg bg-ink-900 p-1.5 ring-2 ring-primary-300 dark:bg-primary-300">
                <Dumbbell className="h-5 w-5 text-primary-300 dark:text-ink-900" aria-hidden="true" />
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
                        ? 'bg-ink-900 text-primary-200 shadow-sm dark:bg-primary-300 dark:text-ink-900'
                        : 'text-slate-700 hover:bg-primary-100 hover:text-ink-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'
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
            <div className="flex items-center gap-2 rounded-lg bg-brand-card px-3 py-1.5 ring-1 ring-brand-line dark:bg-white/10 dark:ring-white/10">
              <Sparkles className="h-4 w-4 text-flame-500" aria-hidden="true" />
              <User className="h-4 w-4 text-primary-700 dark:text-primary-300" aria-hidden="true" />
              <span className="text-sm font-bold text-ink-900 dark:text-slate-100">{user.name || user.email}</span>
              <span className="rounded-lg bg-primary-300 px-2 py-0.5 text-xs font-black uppercase text-ink-900">
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
            className="rounded-lg p-2 text-ink-900 hover:bg-primary-100 dark:text-slate-100 dark:hover:bg-white/10 md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-brand-line bg-brand-paper dark:border-white/10 dark:bg-ink-900 md:hidden">
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
                      ? 'bg-ink-900 text-primary-200 dark:bg-primary-300 dark:text-ink-900'
                      : 'text-slate-700 hover:bg-primary-100 hover:text-ink-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {link.label}
                </Link>
              );
            })}
            <div className="my-2 border-t border-ink-900/10 dark:border-white/10" />
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Theme</span>
              <ThemeToggle />
            </div>
            <div className="flex items-center gap-3 px-3 py-2 text-sm font-bold text-slate-700 dark:text-slate-300">
              <User className="h-5 w-5" aria-hidden="true" />
              <span>{user.name || user.email}</span>
              <span className="ml-auto rounded-lg bg-primary-300 px-2 py-0.5 text-xs font-black uppercase text-ink-900">
                {user.role}
              </span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-primary-100 hover:text-ink-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
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
