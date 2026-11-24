import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { authorize, fail, STAFF } from '@/lib/guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const MAX = 4 * 1024 * 1024; // الصور تُضغط في المتصفح قبل الرفع، وحد Vercel للطلب نحو 4.5MB

// رفع الصورة إلى Cloudinary بتوقيع من الخادم (المفتاح السري لا يصل للمتصفح أبدًا)
export async function POST(req) {
  const { error } = await authorize(req, STAFF);
  if (error) return error;

  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !key || !secret) return fail('إعدادات Cloudinary غير مكتملة في Vercel.', 500);

  let file;
  try { file = (await req.formData()).get('file'); } catch { return fail('طلب غير صالح.'); }
  if (!file || typeof file === 'string') return fail('لم يصل ملف الصورة.');
  if (!ALLOWED[file.type]) return fail('نوع الصورة غير مدعوم. ارفع JPG أو PNG أو WebP.');
  if (file.size > MAX) return fail('حجم الصورة كبير جدًا.');

  const publicId = `${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = crypto.createHash('sha1').update(`public_id=${publicId}&timestamp=${timestamp}${secret}`).digest('hex');

  const fd = new FormData();
  fd.append('file', file, `${publicId}.${ALLOWED[file.type]}`);
  fd.append('api_key', key);
  fd.append('timestamp', String(timestamp));
  fd.append('public_id', publicId);
  fd.append('signature', signature);

  const r = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: 'POST', body: fd });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.public_id) return fail(`تعذر رفع الصورة: ${j?.error?.message || r.status}`, 502);
  return NextResponse.json({
    url: `https://res.cloudinary.com/${cloud}/image/upload/${j.public_id}.${j.format || ALLOWED[file.type]}`,
    bytes: j.bytes,
  });
}
