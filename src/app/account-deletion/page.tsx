import Link from 'next/link';
import { ArrowLeft, Mail, Trash2 } from 'lucide-react';

export const metadata = {
  title: 'Account Deletion | Fitness PT Tracker',
  description: 'How to request deletion of a Fitness PT Tracker account and associated data.',
};

const deletedData = [
  'Account profile details, including name, email address, and role.',
  'Mobile sessions and sign-in records associated with the account.',
  'Appointment, check-in, workout, and progress records where deletion is allowed for the gym account.',
];

const retainedData = [
  'Security, audit, backup, or legal records may be retained where required to protect the service or comply with obligations.',
  'Records connected to active gym operations may be anonymized or retained for operational integrity before final deletion.',
];

/** Public account deletion instructions for Google Play data-safety compliance. */
export default function AccountDeletionPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="btn-ghost mb-8 inline-flex">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Home
        </Link>

        <section className="card">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-red-600 p-3 text-white">
              <Trash2 className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-primary-600 dark:text-primary-400">
                Fitness PT Tracker data request
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Account deletion</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">
                Fitness PT Tracker users can request deletion of their account and associated app data by contacting support.
                Requests are reviewed so active trainer, client, and gym records are handled correctly.
              </p>
            </div>
          </div>

          <section className="mt-10 rounded-lg bg-slate-100 p-5 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-primary-600 dark:text-primary-400" aria-hidden="true" />
              <h2 className="section-title">How to request deletion</h2>
            </div>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-600 dark:text-slate-300">
              <li>Email <a className="font-semibold text-primary-700 hover:text-primary-800 dark:text-primary-300" href="mailto:support@fitness.myapps.com.ng">support@fitness.myapps.com.ng</a> from the email address used for your Fitness PT Tracker account.</li>
              <li>Use the subject line: Fitness PT Tracker account deletion request.</li>
              <li>Include your name, account email, and whether you are a client, trainer, or administrator.</li>
            </ol>
          </section>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <section className="rounded-lg border border-slate-200 p-5 dark:border-slate-700">
              <h2 className="section-title">Data deleted</h2>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {deletedData.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="rounded-lg border border-slate-200 p-5 dark:border-slate-700">
              <h2 className="section-title">Data retained</h2>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {retainedData.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          </div>

          <p className="mt-8 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Deletion requests are normally processed within 30 days after account ownership is verified.
          </p>
        </section>
      </div>
    </main>
  );
}