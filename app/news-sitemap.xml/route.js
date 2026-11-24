import { newsSitemapArticles } from '@/lib/queries';
import { SITE_URL, SITE_NAME } from '@/lib/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; // الكاش عبر ترويسة s-maxage أدناه

const esc = (s) =>
  String(s).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));

// خريطة موقع Google News: أخبار آخر يومين فقط
export async function GET() {
  const items = await newsSitemapArticles();
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n` +
    items
      .map(
        (a) =>
          `<url><loc>${esc(`${SITE_URL}/news/${encodeURIComponent(a.slug)}`)}</loc>` +
          `<news:news><news:publication><news:name>${esc(SITE_NAME)}</news:name><news:language>ar</news:language></news:publication>` +
          `<news:publication_date>${new Date(a.published_at).toISOString()}</news:publication_date>` +
          `<news:title>${esc(a.title)}</news:title></news:news></url>`
      )
      .join('\n') +
    `\n</urlset>`;
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
  });
}
