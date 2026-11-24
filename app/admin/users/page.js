import Link from 'next/link';
import { redirect } from 'next/navigation';
import { rows } from '@/lib/db';
import { getSession } from '@/lib/auth';
import UsersManager from '@/components/UsersManager';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'إدارة المستخدمين', robots: { index: false } };

export default async function Users() {
  const me = await getSession();
  if (!me) redirect('/admin/login');
  if (me.role !== 'admin') redirect('/admin');
  const people = await rows(
    `SELECT p.id, p.full_name, p.role, p.is_active, u.email, (u.id IS NOT NULL) AS has_login,
            (SELECT count(*)::int FROM public.articles a WHERE a.author_id = p.id) AS articles,
            (SELECT COALESCE(sum(a.views), 0)::int FROM public.articles a WHERE a.author_id = p.id AND a.status = 'published') AS views
       FROM public.profiles p LEFT JOIN public.users u ON u.id = p.id
      ORDER BY (u.id IS NULL), p.role, p.full_name`
  );
  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">إدارة المستخدمين</h1>
        <Link href="/admin" className="rounded-md bg-mist px-4 py-2 text-sm font-bold">رجوع للأخبار</Link>
      </div>
      <UsersManager people={people} meId={me.id} />
    </>
  );
}
