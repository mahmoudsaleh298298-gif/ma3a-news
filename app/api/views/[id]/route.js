import { NextResponse } from 'next/server';
import { row } from '@/lib/db';
import { UUID } from '@/lib/guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// عدّاد المشاهدات (عام، يزيد مشاهدة لخبر منشور فقط)
export async function POST(req, { params }) {
  if (!UUID.test(params.id)) return NextResponse.json({ ok: false }, { status: 400 });
  await row(
    `UPDATE public.articles SET views = views + 1
      WHERE id = $1 AND status = 'published' AND published_at <= now()`,
    [params.id]
  );
  return NextResponse.json({ ok: true });
}
