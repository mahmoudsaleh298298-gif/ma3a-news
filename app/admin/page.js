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
  const { data: profile } = await db.from('profiles').select('role,is_active').eq('id', user.id).maybeSingle();
  const role = profile?.is_active === false ? 'viewer' : (profile?.role || 'viewer');
  if (role === 'viewer') {
    return <p className="py-16 text-center text-muted">حسابك بصلاحية «مشاهد فقط» ولا يمكنه إدارة المحتوى.</p>;
  }
  let articleQuery = db.from('articles')
    .select('id,title,slug,status,published_at,views,is_breaking,is_pinned,categories(name)')
    .order('updated_at', { ascending: false }).limit(100);
  if (role === 'writer') articleQuery = articleQuery.eq('author_id', user.id);
  const { data: articles } = await articleQuery;

  let viewsQuery = db.from('articles').select('views').eq('status', 'published');
  if (role === 'writer') viewsQuery = viewsQuery.eq('author_id', user.id);
  const { data: allViews } = await viewsQuery;
  const totalViews = (allViews || []).reduce((n, r) => n + (r.views || 0), 0);
  const top = [...(articles || [])].sort((x, y) => y.views - x.views).slice(0, 5);
  const canDelete = ['admin', 'chief', 'editor'].includes(role);

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">إدارة الأخبار</h1>
        {role === 'admin' && <Link href="/admin/journalists" className="ml-2 rounded-md bg-mist px-4 py-3 font-bold">إدارة الصحفيين</Link>}
        <Link href="/admin/articles/new" className="rounded-md bg-brand px-5 py-3 font-bold text-white hover:bg-brand-dark">+ خبر جديد</Link>
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-md bg-mist p-4"><p className="text-sm text-muted">إجمالي مشاهدات الأخبار</p><p className="text-2xl font-extrabold text-brand">{totalViews.toLocaleString('ar-EG')}</p></div>
        <div className="rounded-md bg-mist p-4"><p className="text-sm text-muted">الأخبار المنشورة</p><p className="text-2xl font-extrabold text-brand">{(allViews || []).length.toLocaleString('ar-EG')}</p></div>
        <div className="rounded-md bg-mist p-4"><p className="text-sm text-muted">الأكثر قراءة</p><ol className="mt-1 list-decimal pr-5 text-sm">{top.map((t) => <li key={t.id} className="truncate">{t.title} ({t.views})</li>)}</ol></div>
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
