import { notFound } from 'next/navigation';
import Link from 'next/link';
import { publicClient } from '@/lib/supabase/public';
import { ARTICLE_FIELDS, SITE_URL } from '@/lib/utils';
import ArticleCard from '@/components/ArticleCard';

export const revalidate = 60;
const PAGE = 12;

async function getCat(slug) {
  const { data } = await publicClient().from('categories').select('id,name,slug').eq('slug', decodeURIComponent(slug)).maybeSingle();
  return data;
}

export async function generateMetadata({ params }) {
  const c = await getCat(params.slug);
  if (!c) return {};
  return { title: `أخبار ${c.name}`, alternates: { canonical: `${SITE_URL}/category/${c.slug}` } };
}

export default async function Category({ params, searchParams }) {
  const c = await getCat(params.slug);
  if (!c) notFound();
  const page = Math.max(1, parseInt(searchParams.page || '1', 10) || 1);
  const from = (page - 1) * PAGE;
  const { data: items } = await publicClient().from('articles').select(ARTICLE_FIELDS)
    .eq('category_id', c.id).eq('status', 'published').lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false }).range(from, from + PAGE);
  const shown = (items || []).slice(0, PAGE);
  const hasMore = (items || []).length > PAGE;

  return (
    <>
      <h1 className="mb-4 border-r-4 border-brand pr-3 text-2xl font-extrabold">أخبار {c.name}</h1>
      {shown.length === 0 ? <p className="py-16 text-center text-muted">لا توجد أخبار في هذا القسم بعد.</p> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{shown.map((a) => <ArticleCard key={a.id} a={a} />)}</div>
      )}
      <div className="mt-8 flex justify-center gap-3">
        {page > 1 && <Link className="rounded-full bg-mist px-5 py-2 font-bold" href={`/category/${c.slug}?page=${page - 1}`}>الأحدث</Link>}
        {hasMore && <Link className="rounded-full bg-brand px-5 py-2 font-bold text-white" href={`/category/${c.slug}?page=${page + 1}`}>تحميل المزيد</Link>}
      </div>
    </>
  );
}
