'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminRow({ a, canDelete }) {
  const router = useRouter();
  async function remove() {
    if (!confirm('حذف هذا الخبر نهائيًا؟')) return;
    const res = await fetch(`/api/articles/${a.id}`, { method: 'DELETE' });
    if (res.ok) router.refresh();
    else alert('تعذر الحذف: ' + ((await res.json().catch(() => ({}))).error || res.status));
  }
  const scheduled = a.status === 'published' && new Date(a.published_at) > new Date();
  const label = a.status === 'draft' ? 'مسودة' : scheduled ? 'مجدول' : 'منشور';
  return (
    <li className="flex flex-wrap items-center gap-3 p-3">
      <div className="min-w-0 flex-1">
        <p className="font-bold">{a.title}</p>
        <p className="text-xs text-muted">
          {a.categories?.name || 'بدون قسم'} · {label}{a.when && ` · ${a.when}`} · {a.views} مشاهدة
          {a.is_breaking && ' · عاجل'}{a.is_pinned && ' · مثبّت'}
        </p>
      </div>
      <Link href={`/admin/articles/${a.id}`} className="rounded-md bg-mist px-4 py-2 text-sm font-bold">تعديل</Link>
      {a.status === 'published' && !scheduled && <Link href={`/news/${a.slug}`} className="rounded-md bg-mist px-4 py-2 text-sm font-bold">عرض</Link>}
      {canDelete && <button onClick={remove} className="rounded-md bg-brand px-4 py-2 text-sm font-bold text-white">حذف</button>}
    </li>
  );
}
