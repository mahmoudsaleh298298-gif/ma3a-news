import { publicClient } from '@/lib/supabase/public';
import { ARTICLE_FIELDS, cleanQuery } from '@/lib/utils';
import ArticleCard from '@/components/ArticleCard';

export const metadata = { title: 'بحث' };

export default async function Search({ searchParams }) {
  const q = cleanQuery(searchParams.q);
  let results = [];
  if (q) {
    const { data } = await publicClient().from('articles').select(ARTICLE_FIELDS)
      .eq('status', 'published').lte('published_at', new Date().toISOString())
      .or(`title.ilike.%${q}%,summary.ilike.%${q}%,content.ilike.%${q}%,keywords.ilike.%${q}%`)
      .order('published_at', { ascending: false }).limit(30);
    results = data || [];
  }
  return (
    <>
      <form action="/search" className="mb-6 flex gap-2">
        <input name="q" defaultValue={q} placeholder="ابحث عن خبر أو لاعب أو نادٍ" autoFocus
          className="min-w-0 flex-1 rounded-md border border-gray-300 px-4 py-3 text-lg" />
        <button className="rounded-md bg-brand px-6 py-3 font-bold text-white hover:bg-brand-dark">بحث</button>
      </form>
      {q && <p className="mb-4 text-muted">{results.length} نتيجة لـ «{q}»</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{results.map((a) => <ArticleCard key={a.id} a={a} />)}</div>
    </>
  );
}
