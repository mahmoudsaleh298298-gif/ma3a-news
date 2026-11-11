import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { publicClient } from '@/lib/supabase/public';
import { ARTICLE_FIELDS, SITE_URL, SITE_NAME, fmtDateTime } from '@/lib/utils';
import ArticleBody from '@/components/ArticleBody';
import ArticleCard from '@/components/ArticleCard';
import ShareButtons from '@/components/ShareButtons';
import AdSlot from '@/components/AdSlot';

export const revalidate = 60;

async function getArticle(slug) {
  const { data } = await publicClient()
    .from('articles').select('*, categories(name,slug)')
    .eq('slug', decodeURIComponent(slug)).eq('status', 'published')
    .lte('published_at', new Date().toISOString()).maybeSingle();
  return data;
}

export async function generateMetadata({ params }) {
  const a = await getArticle(params.slug);
  if (!a) return {};
  const desc = a.seo_description || a.summary || '';
  const url = `${SITE_URL}/news/${a.slug}`;
  return {
    title: a.title,
    description: desc,
    keywords: a.keywords || undefined,
    alternates: { canonical: url },
    openGraph: { title: a.title, description: desc, url, type: 'article', publishedTime: a.published_at, images: a.image_url ? [a.image_url] : [] },
    twitter: { card: 'summary_large_image', title: a.title, description: desc },
  };
}

export default async function NewsPage({ params }) {
  const a = await getArticle(params.slug);
  if (!a) notFound();
  const db = publicClient();
  db.rpc('increment_views', { article_id: a.id }).then(() => {});

  const [{ data: related }, { data: popular }] = await Promise.all([
    db.from('articles').select(ARTICLE_FIELDS).eq('status', 'published').eq('category_id', a.category_id)
      .neq('id', a.id).lte('published_at', new Date().toISOString()).order('published_at', { ascending: false }).limit(4),
    db.from('articles').select('id,title,slug,image_url,published_at,categories(name,slug)').eq('status', 'published')
      .lte('published_at', new Date().toISOString()).order('views', { ascending: false }).limit(5),
  ]);

  const url = `${SITE_URL}/news/${a.slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: a.title,
    description: a.seo_description || a.summary,
    image: a.image_url ? [a.image_url] : undefined,
    datePublished: a.published_at,
    dateModified: a.updated_at,
    mainEntityOfPage: url,
    author: { '@type': 'Person', name: a.author_name || 'فريق التحرير' },
    publisher: { '@type': 'Organization', name: SITE_NAME },
  };
  const crumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: SITE_URL },
      ...(a.categories ? [{ '@type': 'ListItem', position: 2, name: a.categories.name, item: `${SITE_URL}/category/${a.categories.slug}` }] : []),
      { '@type': 'ListItem', position: 3, name: a.title, item: url },
    ],
  };

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />
      <article className="lg:col-span-2">
        <nav className="mb-2 text-sm text-muted" aria-label="مسار التصفح">
          <Link href="/" className="hover:text-brand">الرئيسية</Link>
          {a.categories && <> / <Link href={`/category/${a.categories.slug}`} className="hover:text-brand">{a.categories.name}</Link></>}
        </nav>
        <h1 className="text-2xl font-extrabold leading-snug sm:text-4xl">{a.title}</h1>
        <p className="mt-3 text-sm text-muted">
          {a.author_name || 'فريق التحرير'} · نُشر {fmtDateTime(a.published_at)}
          {a.updated_at && new Date(a.updated_at) - new Date(a.published_at) > 60000 && <> · آخر تحديث {fmtDateTime(a.updated_at)}</>}
          {' '}· {a.views.toLocaleString('ar-EG')} مشاهدة
        </p>
        {a.image_url && (
          <div className="relative mt-4 aspect-video overflow-hidden rounded-md">
            <Image src={a.image_url} alt={a.title} fill priority sizes="(max-width:1024px) 100vw, 66vw" className="object-cover" />
          </div>
        )}
        <div className="my-4"><ShareButtons url={url} title={a.title} /></div>
        {a.summary && <p className="mb-4 text-xl font-bold leading-9">{a.summary}</p>}
        <AdSlot placement="in_article" />
        <ArticleBody text={a.content} />
        {related?.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 border-r-4 border-brand pr-3 text-xl font-extrabold">أخبار ذات صلة</h2>
            <div className="grid gap-4 sm:grid-cols-2">{related.map((r) => <ArticleCard key={r.id} a={r} />)}</div>
          </section>
        )}
      </article>
      <aside className="space-y-6">
        <AdSlot placement="sidebar" />
        <section>
          <h2 className="mb-3 border-r-4 border-brand pr-3 text-xl font-extrabold">الأكثر قراءة</h2>
          <div className="space-y-3">{popular?.map((p) => <ArticleCard key={p.id} a={p} row />)}</div>
        </section>
      </aside>
    </div>
  );
}
