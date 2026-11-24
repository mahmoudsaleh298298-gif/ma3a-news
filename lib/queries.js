import { rows, row } from '@/lib/db';

const CAT = `CASE WHEN c.id IS NULL THEN NULL ELSE json_build_object('name', c.name, 'slug', c.slug) END AS categories`;
const SEL = `a.id, a.title, a.slug, a.summary, a.image_url, a.published_at, a.is_breaking, ${CAT}`;
const FROM = `FROM public.articles a LEFT JOIN public.categories c ON c.id = a.category_id`;
const PUB = `a.status = 'published' AND a.published_at <= now()`;

export const topArticles = (n = 5) =>
  rows(`SELECT ${SEL} ${FROM} WHERE ${PUB} ORDER BY a.is_pinned DESC, a.published_at DESC LIMIT $1`, [n]);

export const breakingArticles = (n = 10) =>
  rows(`SELECT ${SEL} ${FROM} WHERE ${PUB} AND a.is_breaking ORDER BY a.published_at DESC LIMIT $1`, [n]);

export const latestArticles = (n = 12) =>
  rows(`SELECT ${SEL} ${FROM} WHERE ${PUB} ORDER BY a.published_at DESC LIMIT $1`, [n]);

export const categoryArticles = (catId, limit, offset = 0) =>
  rows(`SELECT ${SEL} ${FROM} WHERE ${PUB} AND a.category_id = $1 ORDER BY a.published_at DESC LIMIT $2 OFFSET $3`, [catId, limit, offset]);

export const homeCategories = () =>
  rows(`SELECT id, name, slug FROM public.categories WHERE show_on_home ORDER BY sort_order`);

export const navCategories = () =>
  rows(`SELECT name, slug FROM public.categories WHERE show_in_nav ORDER BY sort_order`);

export const allCategories = () =>
  rows(`SELECT id, name FROM public.categories ORDER BY sort_order`);

export const getCategoryBySlug = (slug) =>
  row(`SELECT id, name, slug FROM public.categories WHERE slug = $1`, [slug]);

export const getArticleBySlug = (slug) =>
  row(`SELECT a.*, ${CAT} ${FROM} WHERE a.slug = $1 AND ${PUB}`, [slug]);

export const relatedArticles = (catId, excludeId, n = 4) =>
  rows(`SELECT ${SEL} ${FROM} WHERE ${PUB} AND a.category_id = $1 AND a.id <> $2 ORDER BY a.published_at DESC LIMIT $3`, [catId, excludeId, n]);

export const popularArticles = (n = 5) =>
  rows(`SELECT ${SEL} ${FROM} WHERE ${PUB} ORDER BY a.views DESC, a.published_at DESC LIMIT $1`, [n]);

export const breakingList = (n = 30) => breakingArticles(n);

export const searchArticles = (q, n = 30) => {
  const like = `%${q.replace(/[\\%_]/g, '\\$&')}%`;
  return rows(
    `SELECT ${SEL} ${FROM} WHERE ${PUB}
       AND (a.title ILIKE $1 OR a.summary ILIKE $1 OR a.content ILIKE $1 OR a.keywords ILIKE $1)
     ORDER BY a.published_at DESC LIMIT $2`,
    [like, n]
  );
};

export const sitemapArticles = () =>
  rows(`SELECT a.slug, a.updated_at FROM public.articles a WHERE ${PUB} ORDER BY a.published_at DESC LIMIT 5000`);

export const sitemapCategories = () => rows(`SELECT slug FROM public.categories`);

export async function getSetting(key) {
  const r = await row(`SELECT value FROM public.settings WHERE key = $1`, [key]);
  return r?.value || null;
}

export const getAd = (placement) =>
  row(`SELECT slot_id FROM public.ads WHERE placement = $1 AND active LIMIT 1`, [placement]);
