import { publicClient } from '@/lib/supabase/public';
import { ARTICLE_FIELDS } from '@/lib/utils';
import ArticleCard from '@/components/ArticleCard';

export const revalidate = 30;
export const metadata = { title: 'أخبار عاجلة' };

export default async function Breaking() {
  const { data } = await publicClient().from('articles').select(ARTICLE_FIELDS)
    .eq('status', 'published').eq('is_breaking', true).lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false }).limit(30);
  return (
    <>
      <h1 className="mb-4 border-r-4 border-brand pr-3 text-2xl font-extrabold">أخبار عاجلة</h1>
      {data?.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{data.map((a) => <ArticleCard key={a.id} a={a} />)}</div>
        : <p className="py-16 text-center text-muted">لا توجد أخبار عاجلة حاليًا.</p>}
    </>
  );
}
