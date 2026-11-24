'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const ROLE_LABEL = { admin: 'مدير', chief: 'رئيس تحرير', editor: 'محرر', writer: 'صحفي', viewer: 'مشاهد' };
const input = 'w-full rounded-md border border-gray-300 px-3 py-2';

async function call(url, method, body) {
  const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.error || `خطأ ${res.status}`);
  return j;
}

function Person({ p, meId }) {
  const router = useRouter();
  const [msg, setMsg] = useState('');
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState('');
  const [name, setName] = useState(p.full_name || '');
  const [bio, setBio] = useState(p.bio || '');
  const isMe = p.id === meId;

  async function patch(body, ok) {
    setMsg('');
    try { await call(`/api/admin/users/${p.id}`, 'PATCH', body); setMsg(ok); setPw(''); router.refresh(); }
    catch (e) { setMsg(e.message); }
  }

  return (
    <li className="space-y-2 p-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-bold">{p.full_name || 'بدون اسم'} <span className="text-xs font-normal text-muted">({ROLE_LABEL[p.role]})</span></p>
          <p className="text-xs text-muted" dir="ltr" style={{ textAlign: 'right' }}>{p.has_login ? p.email : 'لا يوجد حساب دخول'}</p>
          <p className="text-xs text-muted">{p.articles} خبر · {p.views.toLocaleString('ar-EG')} مشاهدة · {p.is_active ? 'مفعّل' : 'موقوف'}</p>
        </div>
        {p.has_login && (
          <button onClick={() => setOpen(!open)} className="rounded-md bg-mist px-4 py-2 text-sm font-bold">{open ? 'إغلاق' : 'تعديل'}</button>
        )}
      </div>
      {open && (
        <div className="grid gap-2 rounded-md bg-mist p-3 sm:grid-cols-2">
          <div className="flex gap-2">
            <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم" />
            <button onClick={() => patch({ name }, 'تم حفظ الاسم.')} className="rounded-md bg-brand px-3 text-sm font-bold text-white">حفظ</button>
          </div>
          <select className={input} defaultValue={p.role} disabled={isMe}
            onChange={(e) => patch({ role: e.target.value }, 'تم تغيير الدور.')}>
            {Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <div className="flex gap-2">
            <input className={input} dir="ltr" type="text" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="كلمة مرور جديدة (8 أحرف+)" />
            <button onClick={() => patch({ password: pw }, 'تم تغيير كلمة المرور.')} className="rounded-md bg-brand px-3 text-sm font-bold text-white">تغيير</button>
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <textarea className={input} rows={2} maxLength={600} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="نبذة قصيرة عن الكاتب وتخصصه (تظهر في صفحة الكاتب)" />
            <button onClick={() => patch({ bio }, 'تم حفظ النبذة.')} className="rounded-md bg-brand px-3 text-sm font-bold text-white">حفظ</button>
          </div>
          {!isMe && (
            <button onClick={() => patch({ is_active: !p.is_active }, p.is_active ? 'تم إيقاف الحساب.' : 'تم تفعيل الحساب.')}
              className="rounded-md bg-white px-3 py-2 text-sm font-bold">{p.is_active ? 'إيقاف الحساب' : 'تفعيل الحساب'}</button>
          )}
        </div>
      )}
      {msg && <p role="status" className="text-sm font-bold text-brand">{msg}</p>}
    </li>
  );
}

export default function UsersManager({ people, meId }) {
  const router = useRouter();
  const orphans = people.filter((p) => !p.has_login);
  const [f, setF] = useState({ email: '', password: '', name: '', role: 'writer', linkId: '' });
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  function pickLink(e) {
    const id = e.target.value;
    const p = orphans.find((x) => x.id === id);
    setF({ ...f, linkId: id, ...(p ? { name: p.full_name || f.name, role: p.role } : {}) });
  }

  async function create(e) {
    e.preventDefault();
    setBusy(true); setMsg('');
    try {
      await call('/api/admin/users', 'POST', f);
      setMsg('تم إنشاء الحساب.');
      setF({ email: '', password: '', name: '', role: 'writer', linkId: '' });
      router.refresh();
    } catch (err) { setMsg(err.message); }
    setBusy(false);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={create} className="space-y-2 rounded-md bg-mist p-4">
        <h2 className="font-extrabold text-brand">إضافة حساب دخول</h2>
        {orphans.length > 0 && (
          <select className={input} value={f.linkId} onChange={pickLink}>
            <option value="">حساب جديد (غير مرتبط بصحفي قديم)</option>
            {orphans.map((p) => <option key={p.id} value={p.id}>ربط بالصحفي القديم: {p.full_name || 'بدون اسم'} — {p.articles} خبر</option>)}
          </select>
        )}
        <div className="grid gap-2 sm:grid-cols-2">
          <input className={input} value={f.name} onChange={set('name')} placeholder="الاسم" />
          <select className={input} value={f.role} onChange={set('role')}>
            {Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input className={input} type="email" required dir="ltr" value={f.email} onChange={set('email')} placeholder="البريد الإلكتروني" />
          <input className={input} type="text" required minLength={8} dir="ltr" value={f.password} onChange={set('password')} placeholder="كلمة المرور (8 أحرف+)" />
        </div>
        {msg && <p role="status" className="text-sm font-bold text-brand">{msg}</p>}
        <button disabled={busy} className="rounded-md bg-brand px-5 py-2 font-bold text-white disabled:opacity-60">إنشاء الحساب</button>
      </form>

      <ul className="divide-y rounded-md border">
        {people.map((p) => <Person key={p.id} p={p} meId={meId} />)}
        {!people.length && <li className="p-6 text-center text-muted">لا يوجد مستخدمون.</li>}
      </ul>
    </div>
  );
}
