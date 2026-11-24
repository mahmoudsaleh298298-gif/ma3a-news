import Link from 'next/link';
import { redirect } from 'next/navigation';
import { rows, row } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { fmtDateTime } from '@/lib/utils';
import AdminRow from '@/components/AdminRow';
import LogoutButton from '@/components/LogoutButton';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'لوحة التحكم', robots: { index: false } };

export default async function Admin() {
  const user = await getSession();
  if (!user) redirect('/admin/login');
  const role = user.role;
  if (role === 'viewer') {
    return (
      <div className="py-16 text-center text-muted">
        <p>حسابك بصلاحية «مشاهد فقط» ولا يمكنه إدارة المحتوى.</p>
        <div className="mt-4"><LogoutButton /></div>
      </div>
    );
  }
  const own = role === 'writer'; // الكاتب يرى أخباره فقط
  const articles = await rows(
    `SELECT a.id, a.title, a.slug, a.status, a.published_at, a.views, a.is_breaking, a.is_pinned,
            CASE WHEN c.id IS NULL THEN NULL ELSE json_build_object('name', c.name) END AS categories
       FROM public.articles a LEFT JOIN public.categories c ON c.id = a.category_id
      ${own ? 'WHERE a.author_id = $1' : ''}
      ORDER BY a.updated_at DESC LIMIT 100`,
    own ? [user.id] : []
  );
  const totals = await row(
    `SELECT count(*)::int AS n, COALESCE(sum(views), 0)::int AS v
       FROM public.articles WHERE status = 'published' ${own ? 'AND author_id = $1' : ''}`,
    own ? [user.id] : []
  );
  const top = [...articles].sort((x, y) => y.views - x.views).slice(0, 5);
  const canDelete = ['admin', 'chief', 'editor'].includes(role);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-extrabold">إدارة الأخبار</h1>
        <div className="flex flex-wrap items-center gap-2">
          {role === 'admin' && <Link href="/admin/users" className="rounded-md bg-mist px-4 py-2 text-sm font-bold">إدارة المستخدمين</Link>}
          <LogoutButton />
          <Link href="/admin/articles/new" className="rounded-md bg-brand px-5 py-3 font-bold text-white hover:bg-brand-dark">+ خبر جديد</Link>
        </div>
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-md bg-mist p-4"><p className="text-sm text-muted">إجمالي مشاهدات الأخبار</p><p className="text-2xl font-extrabold text-brand">{totals.v.toLocaleString('ar-EG')}</p></div>
        <div className="rounded-md bg-mist p-4"><p className="text-sm text-muted">الأخبار المنشورة</p><p className="text-2xl font-extrabold text-brand">{totals.n.toLocaleString('ar-EG')}</p></div>
        <div className="rounded-md bg-mist p-4"><p className="text-sm text-muted">الأكثر قراءة</p><ol className="mt-1 list-decimal pr-5 text-sm">{top.map((t) => <li key={t.id} className="truncate">{t.title} ({t.views})</li>)}</ol></div>
      </div>
      <ul className="divide-y rounded-md border">
        {articles.map((a) => (
          <AdminRow key={a.id} a={{ ...a, when: fmtDateTime(a.published_at) }} canDelete={canDelete} />
        ))}
        {!articles.length && <li className="p-8 text-center text-muted">لا توجد أخبار. أضف أول خبر.</li>}
      </ul>
    </>
  );
}
