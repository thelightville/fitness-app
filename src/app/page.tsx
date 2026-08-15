import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Fitness PT Tracker
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Schedule, track, confirm, and complete your personal training sessions with transparency.
            Built for trainers and clients who want accurate records.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link href="/register" className="btn-primary text-base">
              Get Started
            </Link>
            <Link href="/login" className="btn-secondary text-base">
              Sign In
            </Link>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900">Easy Scheduling</h3>
            <p className="mt-2 text-gray-600">
              Book sessions in advance based on trainer availability and receive calendar invites.
            </p>
          </div>
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900">Location Check-In</h3>
            <p className="mt-2 text-gray-600">
              Confirm attendance with geolocation verification when you arrive at the gym.
            </p>
          </div>
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900">Workout Logging</h3>
            <p className="mt-2 text-gray-600">
              Trainers log workout type, exercises, intensity, and notes for every session.
            </p>
          </div>
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900">Reminders</h3>
            <p className="mt-2 text-gray-600">
              Automated email reminders so clients and trainers never miss a session.
            </p>
          </div>
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900">Transparent Records</h3>
            <p className="mt-2 text-gray-600">
              Both parties see the same appointment history, status, and audit trail.
            </p>
          </div>
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900">Analytics Dashboard</h3>
            <p className="mt-2 text-gray-600">
              Track attendance, completion rates, no-shows, and workout trends over time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
