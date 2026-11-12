'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { browserClient } from '@/lib/supabase/browser';

export default function AdminRow({ a, canDelete, showAuthor = false }) {
  const router = useRouter();
  async function remove() {
    if (!confirm('حذف هذا الخبر نهائيًا؟')) return;
    const { error } = await browserClient().from('articles').delete().eq('id', a.id);
    if (error) alert('تعذر الحذف: ' + error.message); else router.refresh();
  }
  const scheduled = a.status === 'published' && new Date(a.published_at) > new Date();
  const label = a.status === 'draft' ? 'مسودة' : scheduled ? 'مجدول' : 'منشور';
  return (
    <li className="flex flex-wrap items-center gap-3 p-3">
      <div className="min-w-0 flex-1">
        <p className="font-bold">{a.title}</p>
        <p className="text-xs text-muted">
          {a.categories?.name || 'بدون قسم'} · {label}{a.when && ` · ${a.when}`}
          {showAuthor && a.author_name && ` · الكاتب: ${a.author_name}`}
          {a.is_breaking && ' · عاجل'}{a.is_pinned && ' · مثبّت'}
        </p>
      </div>
      <div className="min-w-[4.5rem] rounded-md bg-mist px-3 py-1 text-center" title="عدد المشاهدات">
        <span className="block text-lg font-extrabold leading-tight text-brand">{(a.views ?? 0).toLocaleString('ar-EG')}</span>
        <span className="block text-xs text-muted">مشاهدة</span>
      </div>
      <Link href={`/admin/articles/${a.id}`} className="rounded-md bg-mist px-4 py-2 text-sm font-bold">تعديل</Link>
      {a.status === 'published' && !scheduled && <Link href={`/news/${a.slug}`} className="rounded-md bg-mist px-4 py-2 text-sm font-bold">عرض</Link>}
      {canDelete && <button onClick={remove} className="rounded-md bg-brand px-4 py-2 text-sm font-bold text-white">حذف</button>}
    </li>
  );
}
