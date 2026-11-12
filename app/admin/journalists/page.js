import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import JournalistsClient from './JournalistsClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'إدارة الصحفيين', robots: { index: false } };

export default async function JournalistsPage() {
  const store = cookies();
  const db = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: { getAll: () => store.getAll(), setAll() {} },
  });
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect('/admin/login');
  const { data: profile } = await db.from('profiles').select('role,is_active').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin' || profile?.is_active === false) redirect('/admin');
  return <JournalistsClient />;
}
