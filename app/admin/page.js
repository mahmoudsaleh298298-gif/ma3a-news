import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { fmtDateTime } from '@/lib/utils';
import AdminRow from '@/components/AdminRow';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'لوحة التحكم', robots: { index: false } };

export default async function Admin() {
  const store = cookies();
  const db = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: { getAll: () => store.getAll(), setAll() {} },
  });
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect('/admin/login');
  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).maybeSingle();
  const role = profile?.role || 'viewer';
  if (role === 'viewer') {
    return <p className="py-16 text-center text-muted">حسابك بصلاحية «مشاهد فقط» ولا يمكنه إدارة المحتوى.</p>;
  }
  const { data: articles } = await db.from('articles')
    .select('id,title,slug,status,published_at,views,is_breaking,is_pinned,categories(name)')
    .order('updated_at', { ascending: false }).limit(100);
  const canDelete = ['admin', 'chief', 'editor'].includes(role);

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">إدارة الأخبار</h1>
        <Link href="/admin/articles/new" className="rounded-md bg-brand px-5 py-3 font-bold text-white hover:bg-brand-dark">+ خبر جديد</Link>
      </div>
      <ul className="divide-y rounded-md border">
        {articles?.map((a) => (
          <AdminRow key={a.id} a={{ ...a, when: fmtDateTime(a.published_at) }} canDelete={canDelete} />
        ))}
        {!articles?.length && <li className="p-8 text-center text-muted">لا توجد أخبار. أضف أول خبر.</li>}
      </ul>
    </>
  );
}
