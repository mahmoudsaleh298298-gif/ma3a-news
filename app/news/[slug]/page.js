import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getArticleBySlug, relatedArticles, popularArticles } from '@/lib/queries';
import { SITE_URL, SITE_NAME, fmtDateTime, ogImage } from '@/lib/utils';
import ArticleBody from '@/components/ArticleBody';
import ArticleCard from '@/components/ArticleCard';
import ShareButtons from '@/components/ShareButtons';
import AdSlot from '@/components/AdSlot';
import ViewCounter from '@/components/ViewCounter';

export const revalidate = 60;

const getArticle = (slug) => getArticleBySlug(decodeURIComponent(slug));

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
    openGraph: { title: a.title, description: desc, url, type: 'article', publishedTime: a.published_at, images: a.image_url ? [ogImage(a.image_url)] : [] },
    twitter: { card: 'summary_large_image', title: a.title, description: desc },
  };
}

export default async function NewsPage({ params }) {
  const a = await getArticle(params.slug);
  if (!a) notFound();
  const [related, popular] = await Promise.all([
    a.category_id ? relatedArticles(a.category_id, a.id, 4) : [],
    popularArticles(5),
  ]);

  const url = `${SITE_URL}/news/${a.slug}`;
  // رابط صفحة الكاتب يظهر فقط إذا كان اسم الكاتب المكتوب هو اسم صاحب الحساب نفسه
  const authorLink = a.author_id && a.author_name && a.author_profile_name && a.author_name.trim() === a.author_profile_name.trim() ? `/author/${a.author_id}` : null;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: a.title,
    description: a.seo_description || a.summary,
    image: a.image_url ? [ogImage(a.image_url)] : undefined,
    datePublished: a.published_at,
    dateModified: a.updated_at,
    mainEntityOfPage: url,
    author: { '@type': 'Person', name: a.author_name || 'فريق التحرير', ...(authorLink ? { url: `${SITE_URL}${authorLink}` } : {}) },
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
        <ViewCounter id={a.id} />
        <nav className="mb-2 text-sm text-muted" aria-label="مسار التصفح">
          <Link href="/" className="hover:text-brand">الرئيسية</Link>
          {a.categories && <> / <Link href={`/category/${a.categories.slug}`} className="hover:text-brand">{a.categories.name}</Link></>}
        </nav>
        <h1 className="text-2xl font-extrabold leading-snug sm:text-4xl">{a.title}</h1>
        <p className="mt-3 text-sm text-muted">
          {authorLink ? <Link href={authorLink} className="font-bold hover:text-brand">{a.author_name}</Link> : (a.author_name || 'فريق التحرير')} · نُشر {fmtDateTime(a.published_at)}
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
        {related.length > 0 && (
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
          <div className="space-y-3">{popular.map((p) => <ArticleCard key={p.id} a={p} row />)}</div>
        </section>
      </aside>
    </div>
  );
}
