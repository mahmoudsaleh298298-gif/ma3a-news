import { publicClient } from '@/lib/supabase/public';
import { SITE_URL } from '@/lib/utils';

export const revalidate = 3600;

export default async function sitemap() {
  const db = publicClient();
  const [{ data: arts }, { data: cats }] = await Promise.all([
    db.from('articles').select('slug,updated_at').eq('status', 'published').lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false }).limit(5000),
    db.from('categories').select('slug'),
  ]);
  return [
    { url: SITE_URL, changeFrequency: 'hourly', priority: 1 },
    ...(cats || []).map((c) => ({ url: `${SITE_URL}/category/${c.slug}`, changeFrequency: 'hourly', priority: 0.7 })),
    ...(arts || []).map((a) => ({ url: `${SITE_URL}/news/${a.slug}`, lastModified: a.updated_at, priority: 0.8 })),
  ];
}
