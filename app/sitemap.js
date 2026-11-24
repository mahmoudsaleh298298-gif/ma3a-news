import { sitemapArticles, sitemapCategories } from '@/lib/queries';
import { SITE_URL } from '@/lib/utils';

export const revalidate = 3600;

export default async function sitemap() {
  const [arts, cats] = await Promise.all([sitemapArticles(), sitemapCategories()]);
  return [
    { url: SITE_URL, changeFrequency: 'hourly', priority: 1 },
    ...cats.map((c) => ({ url: `${SITE_URL}/category/${c.slug}`, changeFrequency: 'hourly', priority: 0.7 })),
    ...arts.map((a) => ({ url: `${SITE_URL}/news/${a.slug}`, lastModified: a.updated_at, priority: 0.8 })),
  ];
}
