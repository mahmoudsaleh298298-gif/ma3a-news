import { redirect } from 'next/navigation';
import { row } from '@/lib/db';
import SetupForm from '@/components/SetupForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'إعداد أول مدير', robots: { index: false } };

export default async function Setup() {
  const { n } = await row(`SELECT count(*)::int AS n FROM public.users`);
  if (n > 0) redirect('/admin/login');
  return <SetupForm />;
}
