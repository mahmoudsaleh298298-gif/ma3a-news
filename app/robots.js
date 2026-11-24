import { SITE_URL } from '@/lib/utils';

export default function robots() {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api'] },
    sitemap: [`${SITE_URL}/sitemap.xml`, `${SITE_URL}/news-sitemap.xml`],
  };
}
