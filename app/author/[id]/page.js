import { notFound } from 'next/navigation';
import { getAuthor, authorArticles } from '@/lib/queries';
import { SITE_URL, SITE_NAME, UUID } from '@/lib/utils';
import ArticleCard from '@/components/ArticleCard';

export const revalidate = 120;

async function load(id) {
  if (!UUID.test(id)) return null;
  const a = await getAuthor(id);
  return a && a.articles > 0 ? a : null;
}

export async function generateMetadata({ params }) {
  const a = await load(params.id);
  if (!a) return {};
  return {
    title: `${a.full_name || 'كاتب'} — كاتب في ${SITE_NAME}`,
    description: a.bio || `أحدث أخبار ومقالات ${a.full_name || 'الكاتب'} في ${SITE_NAME}.`,
    alternates: { canonical: `${SITE_URL}/author/${a.id}` },
  };
}

export default async function AuthorPage({ params }) {
  const a = await load(params.id);
  if (!a) notFound();
  const items = await authorArticles(a.id, 30);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name: a.full_name || 'كاتب',
      description: a.bio || undefined,
      url: `${SITE_URL}/author/${a.id}`,
      worksFor: { '@type': 'Organization', name: SITE_NAME },
    },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="mb-6 rounded-md bg-mist p-5">
        <p className="text-sm text-muted">كاتب في {SITE_NAME}</p>
        <h1 className="mt-1 text-3xl font-extrabold">{a.full_name || 'كاتب'}</h1>
        {a.bio && <p className="mt-3 max-w-3xl leading-8">{a.bio}</p>}
        <p className="mt-3 text-sm text-muted">{a.articles.toLocaleString('ar-EG')} خبرًا منشورًا</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((x) => <ArticleCard key={x.id} a={x} />)}
      </div>
    </>
  );
}
