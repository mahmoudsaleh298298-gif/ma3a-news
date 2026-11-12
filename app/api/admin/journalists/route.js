import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { supabaseAdmin } from '@/lib/supabase/admin';

async function requireAdmin() {
  const store = cookies();
  const sessionDb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { getAll: () => store.getAll(), setAll() {} } }
  );
  const { data: { user } } = await sessionDb.auth.getUser();
  if (!user) return { error: 'يجب تسجيل الدخول أولًا.', status: 401 };
  const { data: profile } = await sessionDb.from('profiles').select('role,is_active').eq('id', user.id).maybeSingle();
  if (!profile || profile.role !== 'admin' || profile.is_active === false) {
    return { error: 'هذه العملية متاحة لمدير الموقع فقط.', status: 403 };
  }
  return { user };
}

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const admin = supabaseAdmin();
    const [{ data: profiles, error: profileError }, { data: usersData, error: usersError }] = await Promise.all([
      admin.from('profiles').select('id,full_name,role,is_active').eq('role', 'writer').order('full_name'),
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);
    if (profileError) throw profileError;
    if (usersError) throw usersError;
    const emailById = new Map((usersData.users || []).map((u) => [u.id, u.email || '']));
    return NextResponse.json({ journalists: (profiles || []).map((p) => ({ ...p, email: emailById.get(p.id) || '' })) });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'حدث خطأ غير متوقع.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { full_name, email, password } = await request.json();
    if (!full_name?.trim() || !email?.trim() || !password || password.length < 8) {
      return NextResponse.json({ error: 'أدخل الاسم والبريد وكلمة مرور من 8 أحرف على الأقل.' }, { status: 400 });
    }
    const admin = supabaseAdmin();
    const { data, error } = await admin.auth.admin.createUser({
      email: email.trim().toLowerCase(), password, email_confirm: true,
      user_metadata: { full_name: full_name.trim() },
    });
    if (error) throw error;
    // handle_new_user creates the profile as viewer; promote it only after successful auth creation.
    const { error: updateError } = await admin.from('profiles').upsert({
      id: data.user.id, full_name: full_name.trim(), role: 'writer', is_active: true,
    }, { onConflict: 'id' });
    if (updateError) {
      await admin.auth.admin.deleteUser(data.user.id);
      throw updateError;
    }
    return NextResponse.json({ ok: true, journalist: { id: data.user.id, full_name: full_name.trim(), email: data.user.email, role: 'writer', is_active: true } });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'تعذر إنشاء حساب الصحفي.' }, { status: 400 });
  }
}

export async function PATCH(request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { id, is_active } = await request.json();
    if (!id || typeof is_active !== 'boolean') return NextResponse.json({ error: 'بيانات غير مكتملة.' }, { status: 400 });
    const admin = supabaseAdmin();
    const { error } = await admin.from('profiles').update({ is_active }).eq('id', id).eq('role', 'writer');
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'تعذر تحديث حالة الحساب.' }, { status: 400 });
  }
}
