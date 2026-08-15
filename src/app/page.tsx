import Link from 'next/link';
import {
  CalendarDays,
  MapPinCheck,
  Dumbbell,
  Bell,
  ShieldCheck,
  BarChart3,
  ArrowRight,
} from 'lucide-react';

const features = [
  {
    icon: CalendarDays,
    title: 'Easy Scheduling',
    description: 'Book sessions in advance based on trainer availability and receive calendar invites.',
  },
  {
    icon: MapPinCheck,
    title: 'Location Check-In',
    description: 'Confirm attendance with geolocation verification when you arrive at the gym.',
  },
  {
    icon: Dumbbell,
    title: 'Workout Logging',
    description: 'Trainers log workout type, exercises, intensity, and notes for every session.',
  },
  {
    icon: Bell,
    title: 'Smart Reminders',
    description: 'Automated email reminders so clients and trainers never miss a session.',
  },
  {
    icon: ShieldCheck,
    title: 'Transparent Records',
    description: 'Both parties see the same appointment history, status, and audit trail.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Track attendance, completion rates, no-shows, and workout trends over time.',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-slate-100">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-primary-700">
          <div className="rounded-lg bg-primary-600 p-1.5">
            <Dumbbell className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <span>Fitness PT</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-ghost">
            Sign in
          </Link>
          <Link href="/register" className="btn-primary">
            Get Started
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
            Train smarter. Track every session.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Schedule, confirm, check in, and log workouts — all in one place. Built for personal
            trainers and clients who want accurate, transparent records.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register" className="btn-primary text-base">
              Start training today
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/login" className="btn-secondary text-base">
              Sign in to your account
            </Link>
          </div>
        </div>

        <div className="mt-24 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="card card-hover group transition-all"
              >
                <div className="rounded-xl bg-primary-50 p-3 text-primary-600 transition-colors group-hover:bg-primary-600 group-hover:text-white">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-slate-500 sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Fitness PT Tracker. All rights reserved.</p>
          <p className="mt-2 text-xs text-slate-400">Developed by Waju</p>
        </div>
      </footer>
    </div>
  );
}
