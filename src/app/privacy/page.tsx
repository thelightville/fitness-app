import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | Fitness PT Tracker',
  description: 'Privacy policy for the Fitness PT Tracker web and mobile app.',
};

const sections = [
  {
    title: 'Information We Collect',
    body: [
      'Account details such as name, email address, role, and sign-in records.',
      'Appointment details including session times, trainer assignments, status updates, cancellations, and attendance records.',
      'Gym check-in location data when a user chooses to check in for an appointment near a gym location.',
      'Fitness and progress records entered in the app, such as workout notes, measurements, and training history.',
      'Technical information needed to operate the service, such as device, browser, session, and security logs.',
    ],
  },
  {
    title: 'How We Use Information',
    body: [
      'To provide scheduling, attendance, dashboard, progress tracking, and trainer-client coordination features.',
      'To secure accounts, prevent unauthorized access, and maintain accurate audit records.',
      'To send service-related reminders or updates connected to appointments and account activity.',
      'To diagnose issues, improve reliability, and support users of the web and mobile apps.',
    ],
  },
  {
    title: 'Sharing and Retention',
    body: [
      'Fitness PT Tracker does not sell personal data.',
      'Information is shared only with authorized users in the same fitness workflow, such as trainers, clients, and administrators who need it to manage sessions.',
      'Service providers may process limited data when they host, secure, or deliver the app, and only for operating the service.',
      'Records are retained while an account or gym relationship is active, and may be kept longer when required for security, audit, or legal reasons.',
    ],
  },
  {
    title: 'Choices and Controls',
    body: [
      'Users can update account information from the app where available or ask an administrator for help.',
      'Location access is requested only for check-in features and can be controlled from device or browser settings.',
      'Users can request account, correction, or deletion help through the support page.',
    ],
  },
  {
    title: 'Health and Fitness Notice',
    body: [
      'The app stores fitness and training information for personal training workflows. It is not a medical device, does not provide medical diagnosis, and is not a substitute for professional medical advice.',
    ],
  },
];

/** Public privacy policy page required for app-store review and user transparency. */
export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="btn-ghost mb-8 inline-flex">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Home
        </Link>

        <section className="card">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-primary-600 p-3 text-white">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-primary-600 dark:text-primary-400">
                Last updated: 24 August 2026
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Privacy Policy</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">
                Fitness PT Tracker helps personal trainers, clients, and administrators manage appointments,
                attendance, gym check-ins, workouts, and progress records. This policy explains what the app
                collects and how that information is used.
              </p>
            </div>
          </div>

          <div className="mt-10 space-y-8">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="section-title">{section.title}</h2>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {section.body.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-primary-500" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}

            <section className="rounded-lg bg-slate-100 p-5 dark:bg-slate-900">
              <h2 className="section-title">Contact</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                For privacy, account, or deletion requests, use the support page at{' '}
                <Link href="/account-deletion" className="font-semibold text-primary-700 hover:text-primary-800 dark:text-primary-300">
                  fitness.myapps.com.ng/account-deletion
                </Link>
                .
              </p>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}