import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import NavBar from '@/components/NavBar/NavBar';
import DashboardInit from '@/components/DashboardInit/DashboardInit';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect('/signin');
  }

  return (
    <>
      <NavBar />
      <DashboardInit userId={session.userId} />
      {children}
    </>
  );
}
