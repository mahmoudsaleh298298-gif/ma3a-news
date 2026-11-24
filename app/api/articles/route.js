import { NextResponse } from 'next/server';
import { row } from '@/lib/db';
import { authorize, fail, STAFF } from '@/lib/guard';
import { readArticle } from '@/lib/articleInput';
import { makeSlug } from '@/lib/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  const { session, error } = await authorize(req, STAFF);
  if (error) return error;
  let b;
  try { b = await req.json(); } catch { return fail('بيانات غير صالحة.'); }
  const r = readArticle(b);
  if (r.error) return fail(r.error);
  const v = r.value;
  const isWriter = session.role === 'writer';

  const publishedAt = v.status === 'published' ? (isWriter ? new Date().toISOString() : v.published_at || new Date().toISOString()) : null;
  const authorName = isWriter ? session.name || null : v.author_name;

  const saved = await row(
    `INSERT INTO public.articles
       (title, slug, summary, content, image_url, category_id, author_name, author_id,
        status, published_at, is_breaking, is_pinned, keywords, seo_description, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14, now())
     RETURNING id`,
    [
      v.title, makeSlug(v.title), v.summary, v.content, v.image_url, v.category_id, authorName, session.id,
      v.status, publishedAt, isWriter ? false : v.is_breaking, isWriter ? false : v.is_pinned,
      v.keywords, v.seo_description,
    ]
  );
  return NextResponse.json({ ok: true, id: saved.id });
}
