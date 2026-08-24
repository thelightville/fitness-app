import Link from 'next/link';
import { ArrowLeft, Mail, Shield, Smartphone } from 'lucide-react';

export const metadata = {
  title: 'Support | Fitness PT Tracker',
  description: 'Support and contact information for Fitness PT Tracker users.',
};

const supportTopics = [
  {
    icon: Smartphone,
    title: 'Mobile and Web Access',
    body: 'Get help with sign-in, mobile beta access, appointment visibility, and dashboard access.',
  },
  {
    icon: Shield,
    title: 'Account and Privacy',
    body: 'Request account corrections, password help, privacy questions, or deletion support.',
  },
  {
    icon: Mail,
    title: 'Trainer and Gym Support',
    body: 'Ask an administrator to update trainer assignments, gym locations, or appointment records.',
  },
];

/** Public support page for app-store contact and tester onboarding. */
export default function SupportPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="btn-ghost mb-8 inline-flex">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Home
        </Link>

        <section className="card">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary-600 dark:text-primary-400">
            Fitness PT Tracker support
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Support</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">
            Fitness PT Tracker is managed for personal training workflows at fitness.myapps.com.ng.
            Use this page for beta testing help, account support, privacy requests, and app-store review contact.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {supportTopics.map((topic) => {
              const Icon = topic.icon;
              return (
                <div key={topic.title} className="rounded-lg border border-slate-200 p-5 dark:border-slate-700">
                  <Icon className="h-6 w-6 text-primary-600 dark:text-primary-400" aria-hidden="true" />
                  <h2 className="mt-4 text-base font-bold text-slate-900 dark:text-slate-100">{topic.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{topic.body}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-10 rounded-lg bg-slate-100 p-5 dark:bg-slate-900">
            <h2 className="section-title">Contact</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Email{' '}
              <a className="font-semibold text-primary-700 hover:text-primary-800 dark:text-primary-300" href="mailto:support@fitness.myapps.com.ng">
                support@fitness.myapps.com.ng
              </a>{' '}
              with your account email, device type, and a short description of the issue. Do not include passwords
              or sensitive payment details in support messages.
            </p>
          </div>

          <p className="mt-8 text-sm text-slate-500 dark:text-slate-400">
            Privacy policy:{' '}
            <Link href="/privacy" className="font-semibold text-primary-700 hover:text-primary-800 dark:text-primary-300">
              fitness.myapps.com.ng/privacy
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}