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
  Flame,
  TimerReset,
  LogIn,
  Sparkles,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const features = [
  {
    icon: CalendarDays,
    title: 'Session Command',
    description: 'Book, confirm, reschedule, and track every coaching slot without chasing messages.',
  },
  {
    icon: MapPinCheck,
    title: 'Proof Of Presence',
    description: 'Gym check-ins make attendance records clear for trainers, clients, and operators.',
  },
  {
    icon: Dumbbell,
    title: 'Workout Memory',
    description: 'Capture type, duration, intensity, notes, and context the moment the session ends.',
  },
  {
    icon: Bell,
    title: 'No-Excuse Reminders',
    description: 'Automated nudges keep clients and coaches moving toward the next appointment.',
  },
  {
    icon: ShieldCheck,
    title: 'Shared Truth',
    description: 'Both sides see the same history, status trail, and completed training evidence.',
  },
  {
    icon: BarChart3,
    title: 'Performance Pulse',
    description: 'Spot attendance, completion, no-show, and progress trends before they drift.',
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
    <div className="min-h-screen overflow-hidden bg-brand-paper text-ink-900 dark:bg-ink-900 dark:text-slate-100">
      <header className="motion-rise absolute inset-x-0 top-0 z-30 mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-5 sm:gap-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2 rounded-lg bg-white/90 px-2.5 py-2 text-sm font-black tracking-tight text-ink-900 shadow-sm ring-1 ring-white/50 backdrop-blur sm:text-xl">
          <Image
            src="/images/icon-512.png"
            alt="Fitness PT Tracker"
            width={40}
            height={40}
            className="h-8 w-8 shrink-0 rounded-xl shadow-sm sm:h-10 sm:w-10"
            priority
            unoptimized
          />
          <span className="whitespace-nowrap">Fitness PT</span>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link href="/login" className="btn bg-white/90 px-2.5 py-2 text-xs text-ink-900 ring-1 ring-white/60 backdrop-blur hover:bg-primary-100 sm:px-4 sm:py-2.5 sm:text-sm">
            <LogIn className="h-4 w-4" aria-hidden="true" />
            Sign in
          </Link>
          <Link href="/register" className="btn-primary px-3 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Get Started
          </Link>
        </div>
      </header>

      <main>
        <section className="relative min-h-[92vh] overflow-hidden bg-ink-900 text-white">
          <Image
            src="/images/stock-strength-training.jpg"
            alt="Athlete strength training in a gym"
            fill
            className="motion-drift object-cover opacity-70"
            priority
            sizes="100vw"
            unoptimized
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(16,19,15,0.92),rgba(16,19,15,0.60)_48%,rgba(16,19,15,0.16))]" />
          <div className="relative z-10 mx-auto flex min-h-[92vh] max-w-7xl items-end px-4 pb-14 pt-32 sm:px-6 lg:px-8 lg:pb-20">
            <div className="max-w-4xl">
              <p className="motion-rise motion-delay-1 inline-flex rounded-lg bg-primary-300 px-4 py-2 text-sm font-black uppercase text-ink-900 ring-1 ring-white/20">
                Personal training with proof, pace, and polish
              </p>
              <h1 className="motion-rise motion-delay-2 mt-6 max-w-4xl font-display text-5xl font-black leading-[0.95] tracking-normal text-white sm:text-7xl lg:text-8xl">
                The gym floor, finally in sync.
            </h1>
            <p className="motion-rise motion-delay-3 mt-6 max-w-2xl text-lg font-semibold leading-8 text-slate-100 sm:text-xl">
              A sharper operating system for trainers and clients: bookings, live attendance, workout notes, and progress signals wrapped in one premium mobile-first experience.
            </p>
            <div className="motion-rise motion-delay-4 mt-10 flex flex-col gap-4 sm:flex-row">
              <Link href="/register" className="btn-primary text-base">
                Start your next block
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/login" className="btn border border-white/25 bg-white/10 text-base text-white backdrop-blur hover:bg-white/20">
                Open dashboard
              </Link>
            </div>
            <div className="motion-fade motion-delay-4 mt-12 grid max-w-3xl grid-cols-3 gap-3 border-t border-white/20 pt-6 sm:gap-6">
              <div className="rounded-lg bg-white/10 p-4 backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/15">
                <p className="font-display text-3xl font-black text-primary-200">24/7</p>
                <p className="mt-1 text-xs font-black uppercase text-slate-200">Session access</p>
              </div>
              <div className="rounded-lg bg-white/10 p-4 backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/15">
                <p className="font-display text-3xl font-black text-primary-200">GPS</p>
                <p className="mt-1 text-xs font-black uppercase text-slate-200">Gym check-ins</p>
              </div>
              <div className="rounded-lg bg-white/10 p-4 backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/15">
                <p className="font-display text-3xl font-black text-primary-200">Live</p>
                <p className="mt-1 text-xs font-black uppercase text-slate-200">Progress logs</p>
              </div>
            </div>
          </div>
          </div>
        </section>

        <section className="bg-brand-paper px-4 py-16 dark:bg-ink-900 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-sm font-black uppercase text-flame-600">New brand direction</p>
              <h2 className="mt-3 max-w-xl font-display text-4xl font-black leading-tight text-ink-900 dark:text-white sm:text-5xl">
                Premium coaching software that looks like it belongs in a serious studio.
              </h2>
            </div>
            <p className="max-w-2xl text-base font-semibold leading-8 text-slate-700 dark:text-slate-300">
              The experience now leans into contrast, motion-ready surfaces, and real training photography. It feels less like a form portal and more like a command center for coached progress.
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-7xl gap-4 md:grid-cols-3">
            {stockPhotos.map((photo, index) => (
              <article key={photo.title} className="motion-rise group overflow-hidden rounded-lg bg-ink-900 text-white shadow-card">
                <div className="relative aspect-[4/5] overflow-hidden">
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                    sizes="(min-width: 768px) 33vw, 100vw"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/28 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <p className="font-display text-5xl font-black text-primary-200">0{index + 1}</p>
                    <h3 className="mt-2 font-display text-2xl font-black">{photo.title}</h3>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-200">{photo.description}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-ink-900 px-4 py-16 text-white sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <p className="inline-flex items-center gap-2 rounded-lg bg-primary-300 px-3 py-1.5 text-xs font-black uppercase text-ink-900">
                  <Flame className="h-4 w-4" aria-hidden="true" /> Built for momentum
                </p>
                <h2 className="mt-4 font-display text-4xl font-black leading-tight sm:text-5xl">Everything that keeps a training business moving.</h2>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                <TimerReset className="h-5 w-5 text-flame-300" aria-hidden="true" />
                <p className="text-sm font-bold text-slate-200">Designed for daily use by busy coaches.</p>
              </div>
            </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="motion-rise group rounded-lg border border-white/10 bg-white/[0.04] p-6 transition-all hover:-translate-y-1 hover:bg-white/[0.08]"
              >
                <div className="inline-flex rounded-lg bg-primary-300 p-3 text-ink-900 transition-colors group-hover:bg-flame-300">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="mt-4 font-display text-xl font-black text-white">{feature.title}</h3>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-300">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-brand-line bg-brand-paper py-8 dark:border-white/10 dark:bg-ink-900">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm font-semibold text-slate-600 dark:text-slate-400 sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Fitness PT Tracker. All rights reserved.</p>
          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">Developed by Waju</p>
        </div>
      </footer>
    </div>
  );
}
