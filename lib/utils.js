export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
export const SITE_NAME = 'مع المشجع | نيوز';

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

// يحذف الرموز التي قد تربك البحث
export function cleanQuery(q) {
  return (q || '').replace(/[,()%*\\]/g, ' ').trim().slice(0, 60);
}

// صورة المشاركة (فيسبوك/تويتر): نسخة JPG بعرض 1200 من Cloudinary
export function ogImage(url) {
  if (!url) return undefined;
  const m = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/.exec(url);
  if (!m) return url;
  return `${m[1]}f_jpg,q_auto,c_limit,w_1200/${m[2].replace(/\.(webp|jpe?g|png|avif)$/i, '')}`;
}
