import { NextResponse } from 'next/server';
import { row } from '@/lib/db';
import { authorize, fail, STAFF, EDITORS, UUID } from '@/lib/guard';
import { readArticle } from '@/lib/articleInput';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(req, { params }) {
  if (!UUID.test(params.id)) return fail('معرّف غير صالح.');
  const { session, error } = await authorize(req, STAFF);
  if (error) return error;
  const old = await row(`SELECT id, author_id, status, published_at FROM public.articles WHERE id = $1`, [params.id]);
  if (!old) return fail('الخبر غير موجود.', 404);
  const isWriter = session.role === 'writer';
  if (isWriter && old.author_id !== session.id) return fail('لا يمكنك تعديل خبر كاتب آخر.', 403);

  let b;
  try { b = await req.json(); } catch { return fail('بيانات غير صالحة.'); }
  const r = readArticle(b);
  if (r.error) return fail(r.error);
  const v = r.value;

  let publishedAt = null;
  if (v.status === 'published') {
    publishedAt = isWriter
      ? (old.status === 'published' && old.published_at ? old.published_at : new Date().toISOString())
      : v.published_at || new Date().toISOString();
  }

  // الكاتب لا يغيّر اسم الكاتب ولا العاجل ولا التثبيت
  await row(
    `UPDATE public.articles SET
        title = $2, summary = $3, content = $4, image_url = $5, category_id = $6,
        author_name = CASE WHEN $7 THEN author_name ELSE $8 END,
        is_breaking = CASE WHEN $7 THEN is_breaking ELSE $9 END,
        is_pinned   = CASE WHEN $7 THEN is_pinned   ELSE $10 END,
        keywords = $11, seo_description = $12, status = $13, published_at = $14, updated_at = now()
      WHERE id = $1`,
    [
      params.id, v.title, v.summary, v.content, v.image_url, v.category_id,
      isWriter, v.author_name, v.is_breaking, v.is_pinned,
      v.keywords, v.seo_description, v.status, publishedAt,
    ]
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(req, { params }) {
  if (!UUID.test(params.id)) return fail('معرّف غير صالح.');
  const { error } = await authorize(req, EDITORS);
  if (error) return error;
  await row(`DELETE FROM public.articles WHERE id = $1`, [params.id]);
  return NextResponse.json({ ok: true });
}
