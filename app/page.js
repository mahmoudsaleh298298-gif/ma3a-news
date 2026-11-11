import Link from 'next/link';
import { publicClient } from '@/lib/supabase/public';
import { ARTICLE_FIELDS, fmtDateTime } from '@/lib/utils';
import ArticleCard, { Thumb } from '@/components/ArticleCard';
import AdSlot from '@/components/AdSlot';

export const revalidate = 60;

export default async function Home() {
  const db = publicClient();
  const now = new Date().toISOString();
  const base = () => db.from('articles').select(ARTICLE_FIELDS).eq('status', 'published').lte('published_at', now);

  const [{ data: top }, { data: breaking }, { data: latest }, { data: cats }] = await Promise.all([
    base().order('is_pinned', { ascending: false }).order('published_at', { ascending: false }).limit(5),
    base().eq('is_breaking', true).order('published_at', { ascending: false }).limit(10),
    base().order('published_at', { ascending: false }).limit(12),
    db.from('categories').select('id,name,slug').eq('show_on_home', true).order('sort_order'),
  ]);

  const sections = await Promise.all(
    (cats || []).map(async (c) => {
      const { data } = await base().eq('category_id', c.id).order('published_at', { ascending: false }).limit(4);
      return { ...c, items: data || [] };
    })
  );

  const [hero, ...side] = top || [];

  if (!hero) {
    return <p className="py-20 text-center text-muted">لا توجد أخبار منشورة بعد. أضف أول خبر من لوحة التحكم.</p>;
  }

  return (
    <>
      {breaking?.length > 0 && (
        <div className="mb-4 flex items-center overflow-hidden rounded-md bg-brand text-white">
          <span className="shrink-0 bg-brand-dark px-3 py-2 text-sm font-extrabold">عاجل | آخر الأخبار الرياضية</span>
          <div className="relative h-9 flex-1 overflow-hidden">
            <div className="ticker-move absolute whitespace-nowrap py-2 text-sm font-bold" style={{ animation: 'ticker 40s linear infinite' }}>
              {breaking.map((b) => (
                <Link key={b.id} href={`/news/${b.slug}`} className="mx-6 hover:underline">{b.title}</Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <section className="grid gap-4 lg:grid-cols-3">
        <Link href={`/news/${hero.slug}`} className="group relative block overflow-hidden rounded-md lg:col-span-2">
          <div className="relative aspect-video">
            <Thumb src={hero.image_url} alt={hero.title} sizes="(max-width:1024px) 100vw, 66vw" priority />
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-dark/95 to-transparent p-4 pt-16 text-white">
            <span className="text-xs font-bold">{hero.categories?.name}</span>
            <h1 className="text-xl font-extrabold leading-snug sm:text-3xl">{hero.title}</h1>
            <time className="text-xs opacity-90">{fmtDateTime(hero.published_at)}</time>
          </div>
        </Link>
        <div className="space-y-3">
          {side.map((a) => <ArticleCard key={a.id} a={a} row />)}
        </div>
      </section>

      <AdSlot placement="top" />

      <section className="mt-8">
        <h2 className="mb-3 border-r-4 border-brand pr-3 text-xl font-extrabold">آخر الأخبار</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {latest?.map((a) => <ArticleCard key={a.id} a={a} />)}
        </div>
      </section>

      {sections.filter((s) => s.items.length).map((s, i) => (
        <section key={s.id} className="mt-8">
          {i === 1 && <AdSlot placement="between_sections" />}
          <div className="mb-3 flex items-center justify-between border-b-2 border-brand pb-2">
            <h2 className="text-xl font-extrabold text-brand">{s.name}</h2>
            <Link href={`/category/${s.slug}`} className="text-sm font-bold text-brand hover:underline">المزيد من {s.name}</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {s.items.map((a) => <ArticleCard key={a.id} a={a} />)}
          </div>
        </section>
      ))}
    </>
  );
}
