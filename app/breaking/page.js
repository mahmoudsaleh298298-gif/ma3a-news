import { breakingList } from '@/lib/queries';
import ArticleCard from '@/components/ArticleCard';

export const revalidate = 30;
export const metadata = { title: 'أخبار عاجلة' };

export default async function Breaking() {
  const data = await breakingList(30);
  return (
    <>
      <h1 className="mb-4 border-r-4 border-brand pr-3 text-2xl font-extrabold">أخبار عاجلة</h1>
      {data.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{data.map((a) => <ArticleCard key={a.id} a={a} />)}</div>
        : <p className="py-16 text-center text-muted">لا توجد أخبار عاجلة حاليًا.</p>}
    </>
  );
}
