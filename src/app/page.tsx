import Link from 'next/link';
import Image from 'next/image';
import {
  CalendarDays,
  MapPinCheck,
  Dumbbell,
  Bell,
  ShieldCheck,
  BarChart3,
  ArrowRight,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

const stockPhotos = [
  {
    src: '/images/stock-gym-coaching.jpg',
    alt: 'Personal trainer coaching a client during a gym session',
    title: 'Coach-led sessions',
    description: 'Real coaching photography for trainer-led session planning.',
  },
  {
    src: '/images/stock-gym-equipment.jpg',
    alt: 'Gym equipment prepared for a training session',
    title: 'Verified attendance',
    description: 'Actual gym context for check-ins, appointments, and confirmed visits.',
  },
  {
    src: '/images/stock-strength-training.jpg',
    alt: 'Athlete strength training in a gym',
    title: 'Measured progress',
    description: 'Training photography paired with workout and progress records.',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#f7fbf7] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2 text-lg font-extrabold tracking-tight text-primary-700 dark:text-primary-400 sm:text-xl">
          <Image
            src="/images/icon-512.png"
            alt="Fitness PT Tracker"
            width={40}
            height={40}
            className="h-9 w-9 shrink-0 rounded-xl shadow-sm sm:h-10 sm:w-10"
            priority
            unoptimized
          />
          <span className="hidden whitespace-nowrap sm:inline">Fitness PT</span>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link href="/login" className="btn-ghost px-2.5 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm">
            Sign in
          </Link>
          <Link href="/register" className="btn-primary px-3 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm">
            Get Started
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8 lg:pb-24">
        <section className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="max-w-2xl">
            <p className="inline-flex rounded-full bg-primary-100 px-4 py-2 text-sm font-bold text-primary-800 ring-1 ring-primary-200 dark:bg-primary-400/10 dark:text-primary-200 dark:ring-primary-400/20">
              Personal training, scheduling, and progress in one place
            </p>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-6xl dark:text-slate-100">
              Train smarter. Track every session.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-700 dark:text-slate-300">
              Schedule, confirm, check in, and log workouts — all in one place. Built for personal
              trainers and clients who want accurate, transparent records.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link href="/register" className="btn-primary text-base">
                Start training today
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/login" className="btn-secondary text-base">
                Sign in to your account
              </Link>
            </div>
            <div className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-slate-200 pt-6 dark:border-slate-800">
              <div>
                <p className="text-2xl font-extrabold text-slate-950 dark:text-white">24/7</p>
                <p className="mt-1 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Session access</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-950 dark:text-white">GPS</p>
                <p className="mt-1 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Gym check-ins</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-950 dark:text-white">Live</p>
                <p className="mt-1 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Progress logs</p>
              </div>
            </div>
          </div>

          <div className="relative min-h-[420px] sm:min-h-[560px] lg:min-h-[640px]">
            <div className="absolute inset-x-8 top-8 h-72 rounded-full bg-emerald-300/30 blur-3xl dark:bg-primary-500/20" />
            <div className="relative mx-auto max-w-[590px] overflow-hidden rounded-[2rem] bg-slate-950 p-3 shadow-2xl ring-1 ring-slate-900/10 dark:bg-slate-900 dark:ring-white/10 lg:ml-auto">
              <Image
                src="/images/stock-gym-equipment.jpg"
                alt="Gym floor with dumbbells ready for a training session"
                width={1200}
                height={900}
                className="aspect-[4/3] w-full rounded-[1.5rem] object-cover"
                priority
                unoptimized
              />
              <div className="absolute inset-x-3 bottom-3 rounded-b-[1.5rem] bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent p-6 text-white">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-primary-200">Live gym floor</p>
                <p className="mt-2 text-2xl font-black">Appointments, check-ins, and progress in the same real-world workflow.</p>
              </div>
            </div>
            <div className="absolute bottom-4 left-0 w-[52%] overflow-hidden rounded-3xl bg-white p-2 shadow-2xl ring-1 ring-slate-900/10 dark:bg-slate-900 dark:ring-white/10 sm:-bottom-2 sm:left-8 sm:w-[58%] sm:p-3">
              <Image
                src="/images/stock-gym-coaching.jpg"
                alt="Athlete completing coached floor work in a bright studio"
                width={900}
                height={720}
                className="aspect-[5/4] w-full rounded-2xl object-cover"
                unoptimized
              />
            </div>
            <div className="absolute bottom-16 right-0 w-[38%] overflow-hidden rounded-3xl bg-white p-2 shadow-xl ring-1 ring-slate-900/10 dark:bg-slate-900 dark:ring-white/10 sm:bottom-24 sm:w-[42%] sm:p-3">
              <Image
                src="/images/stock-strength-training.jpg"
                alt="Athlete preparing a barbell lift on a gym floor"
                width={700}
                height={700}
                className="aspect-square rounded-2xl object-cover"
                unoptimized
              />
            </div>
          </div>
        </section>

        <section className="mt-20 rounded-[2rem] bg-white/80 p-4 shadow-card ring-1 ring-slate-900/5 backdrop-blur dark:bg-slate-900/70 dark:ring-white/10 sm:p-6 lg:p-8">
          <div className="grid gap-4 sm:grid-cols-3">
            {stockPhotos.map((photo) => (
              <article key={photo.title} className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  width={960}
                  height={640}
                  className="aspect-[3/2] w-full object-cover"
                  unoptimized
                />
                <div className="p-4">
                  <h2 className="text-base font-extrabold text-slate-950 dark:text-white">{photo.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{photo.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="card card-hover group transition-all dark:bg-slate-900"
              >
                <div className="inline-flex rounded-xl bg-primary-50 p-3 text-primary-600 transition-colors group-hover:bg-primary-600 group-hover:text-white dark:bg-primary-400/10 dark:text-primary-300">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-100">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-8 dark:border-slate-700 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-slate-500 dark:text-slate-400 sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Fitness PT Tracker. All rights reserved.</p>
          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">Developed by Waju</p>
        </div>
      </footer>
    </div>
  );
}
