import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { supabaseAdmin } from '@/lib/supabase/admin';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function arabicError(e, fallback) {
  const m = (e?.message || '').toLowerCase();
  if (m.includes('already') && (m.includes('registered') || m.includes('exists'))) return 'هذا البريد مسجّل مسبقًا.';
  if (m.includes('password')) return 'كلمة المرور غير مقبولة (8 أحرف على الأقل).';
  if (m.includes('email') && m.includes('invalid')) return 'صيغة البريد الإلكتروني غير صحيحة.';
  return e?.message || fallback;
}

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

// عدد أخبار كل صحفي ومشاهداتها (مع تقسيم الصفحات حتى لا يُقطع الحساب عند 1000 صف)
async function loadStats(admin, ids) {
  const stats = new Map(ids.map((id) => [id, { articles_count: 0, published_count: 0, views_total: 0 }]));
  if (!ids.length) return stats;
  const size = 1000;
  for (let from = 0; ; from += size) {
    const { data, error } = await admin.from('articles').select('author_id,views,status')
      .in('author_id', ids).order('id').range(from, from + size - 1);
    if (error) throw error;
    for (const r of data) {
      const s = stats.get(r.author_id);
      if (!s) continue;
      s.articles_count += 1;
      if (r.status === 'published') s.published_count += 1;
      s.views_total += r.views || 0;
    }
    if (data.length < size) break;
  }
  return stats;
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
    const stats = await loadStats(admin, (profiles || []).map((p) => p.id));
    return NextResponse.json({
      journalists: (profiles || []).map((p) => ({ ...p, email: emailById.get(p.id) || '', ...stats.get(p.id) })),
    });
  } catch (e) {
    return NextResponse.json({ error: arabicError(e, 'حدث خطأ غير متوقع.') }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { full_name, email, password } = await request.json();
    if (!full_name?.trim() || !EMAIL_RE.test(email?.trim() || '') || !password || password.length < 8) {
      return NextResponse.json({ error: 'أدخل الاسم وبريدًا صحيحًا وكلمة مرور من 8 أحرف على الأقل.' }, { status: 400 });
    }
    const admin = supabaseAdmin();
    const { data, error } = await admin.auth.admin.createUser({
      email: email.trim().toLowerCase(), password, email_confirm: true,
      user_metadata: { full_name: full_name.trim() },
    });
    if (error) throw error;
    // الـ trigger ينشئ الملف الشخصي بدور viewer، ثم نرقّيه إلى writer بعد نجاح إنشاء الحساب.
    const { error: updateError } = await admin.from('profiles').upsert({
      id: data.user.id, full_name: full_name.trim(), role: 'writer', is_active: true,
    }, { onConflict: 'id' });
    if (updateError) {
      await admin.auth.admin.deleteUser(data.user.id);
      throw updateError;
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: arabicError(e, 'تعذر إنشاء حساب الصحفي.') }, { status: 400 });
  }
}

// تعديل الاسم أو البريد أو كلمة المرور أو حالة الحساب. المدير فقط، وعلى حسابات الصحفيين فقط.
export async function PATCH(request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { id, full_name, email, password, is_active } = await request.json();
    if (!id) return NextResponse.json({ error: 'بيانات غير مكتملة.' }, { status: 400 });

    const admin = supabaseAdmin();
    const { data: target } = await admin.from('profiles').select('id,role').eq('id', id).maybeSingle();
    if (!target || target.role !== 'writer') {
      return NextResponse.json({ error: 'الحساب غير موجود أو ليس حساب صحفي.' }, { status: 404 });
    }

    const name = typeof full_name === 'string' ? full_name.trim() : undefined;
    const mail = typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : undefined;
    const pass = typeof password === 'string' && password.length ? password : undefined;
    if (name !== undefined && !name) return NextResponse.json({ error: 'الاسم لا يمكن أن يكون فارغًا.' }, { status: 400 });
    if (mail && !EMAIL_RE.test(mail)) return NextResponse.json({ error: 'صيغة البريد غير صحيحة.' }, { status: 400 });
    if (pass && pass.length < 8) return NextResponse.json({ error: 'كلمة المرور 8 أحرف على الأقل.' }, { status: 400 });
    if (is_active !== undefined && typeof is_active !== 'boolean') {
      return NextResponse.json({ error: 'قيمة الحالة غير صحيحة.' }, { status: 400 });
    }

    // الإيقاف في قاعدة البيانات أولًا لأنه هو الذي يمنع الصلاحيات فعليًا.
    if (is_active !== undefined) {
      const { error } = await admin.from('profiles').update({ is_active }).eq('id', id).eq('role', 'writer');
      if (error) throw error;
    }

    const authUpdate = {};
    if (mail) { authUpdate.email = mail; authUpdate.email_confirm = true; }
    if (pass) authUpdate.password = pass;
    if (name) authUpdate.user_metadata = { full_name: name };
    if (is_active !== undefined) authUpdate.ban_duration = is_active ? 'none' : '876000h';
    if (Object.keys(authUpdate).length) {
      const { error } = await admin.auth.admin.updateUserById(id, authUpdate);
      if (error) throw error;
    }

    if (name) {
      const { error } = await admin.from('profiles').update({ full_name: name }).eq('id', id).eq('role', 'writer');
      if (error) throw error;
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: arabicError(e, 'تعذر تحديث الحساب.') }, { status: 400 });
  }
}
