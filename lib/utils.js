export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
export const SITE_NAME = 'مع المشجع | نيوز';

export const ARTICLE_FIELDS =
  'id,title,slug,summary,image_url,published_at,is_breaking,categories(name,slug)';

export function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function fmtDateTime(d) {
  if (!d) return '';
  return new Date(d).toLocaleString('ar-EG', {
    day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

export function makeSlug(title) {
  const base = title
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .slice(0, 60);
  return `${base}-${Math.random().toString(36).slice(2, 7)}`;
}

// يحذف الرموز التي تكسر فلتر البحث
export function cleanQuery(q) {
  return (q || '').replace(/[,()%*\\]/g, ' ').trim().slice(0, 60);
}
