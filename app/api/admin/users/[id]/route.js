import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { row, tx } from '@/lib/db';
import { authorize, fail, UUID, ROLES } from '@/lib/guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// تعديل حساب: الاسم، الدور، التفعيل، كلمة المرور، البريد (للمدير فقط)
export async function PATCH(req, { params }) {
  if (!UUID.test(params.id)) return fail('معرّف غير صالح.');
  const { session, error } = await authorize(req, ['admin']);
  if (error) return error;
  let b;
  try { b = await req.json(); } catch { return fail('بيانات غير صالحة.'); }

  const cur = await row(`SELECT p.id, p.role, p.is_active FROM public.profiles p WHERE p.id = $1`, [params.id]);
  if (!cur) return fail('الحساب غير موجود.', 404);

  const isSelf = params.id === session.id;
  if (isSelf && (b.is_active === false || (b.role && b.role !== 'admin'))) {
    return fail('لا يمكنك إيقاف حسابك أو خفض صلاحيتك بنفسك.');
  }
  if (b.role && !ROLES.includes(b.role)) return fail('الدور غير صالح.');
  if (b.password != null && String(b.password).length < 8) return fail('كلمة المرور يجب ألا تقل عن 8 أحرف.');
  let email = null;
  if (b.email != null) {
    email = String(b.email).trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail('البريد الإلكتروني غير صالح.');
    if (await row(`SELECT 1 FROM public.users WHERE email = $1 AND id <> $2`, [email, params.id])) return fail('هذا البريد مسجّل لحساب آخر.');
  }

  await tx(async (c) => {
    await c.query(
      `UPDATE public.profiles SET
          full_name = CASE WHEN $2::boolean THEN $3 ELSE full_name END,
          role      = COALESCE($4, role),
          is_active = COALESCE($5, is_active)
        WHERE id = $1`,
      [params.id, b.name !== undefined, String(b.name ?? '').trim() || null, b.role || null, typeof b.is_active === 'boolean' ? b.is_active : null]
    );
    if (b.password) {
      await c.query(`UPDATE public.users SET password_hash = $2 WHERE id = $1`, [params.id, await bcrypt.hash(String(b.password), 10)]);
    }
    if (email) await c.query(`UPDATE public.users SET email = $2 WHERE id = $1`, [params.id, email]);
  });
  return NextResponse.json({ ok: true });
}
