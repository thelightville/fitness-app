import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AdminSubNav } from '@/components/admin-sub-nav';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-6">
      <AdminSubNav />
      {children}
    </div>
  );
}
