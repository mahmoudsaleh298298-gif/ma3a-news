'use client';
import { Fragment, useEffect, useState } from 'react';

const num = (n) => (n || 0).toLocaleString('ar-EG');

export default function JournalistsPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ full_name: '', email: '', password: '' });
  const [edit, setEdit] = useState(null); // { id, full_name, email, password }
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function load() {
    const res = await fetch('/api/admin/journalists');
    const data = await res.json();
    if (!res.ok) { setMessage(data.error || 'تعذر تحميل الصحفيين.'); return; }
    setItems(data.journalists || []);
  }
  useEffect(() => { load(); }, []);

  async function call(method, body) {
    const res = await fetch('/api/admin/journalists', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    return { ok: res.ok, data };
  }

  async function create(e) {
    e.preventDefault(); setBusy(true); setMessage('');
    const { ok, data } = await call('POST', form);
    setBusy(false);
    if (!ok) { setMessage(data.error || 'تعذر إنشاء الحساب.'); return; }
    setForm({ full_name: '', email: '', password: '' });
    setMessage('تم إنشاء حساب الصحفي بنجاح. أرسل له البريد وكلمة المرور بطريقة آمنة.');
    load();
  }

  async function toggle(item) {
    const next = !item.is_active;
    if (!confirm(next ? 'إعادة تفعيل حساب الصحفي؟' : 'إيقاف حساب الصحفي؟')) return;
    const { ok, data } = await call('PATCH', { id: item.id, is_active: next });
    if (!ok) { setMessage(data.error || 'تعذر تحديث الحساب.'); return; }
    setMessage(next ? 'تمت إعادة تفعيل الحساب.' : 'تم إيقاف الحساب.');
    load();
  }

  async function saveEdit(e) {
    e.preventDefault(); setBusy(true); setMessage('');
    const body = { id: edit.id, full_name: edit.full_name, email: edit.email };
    if (edit.password) body.password = edit.password;
    const { ok, data } = await call('PATCH', body);
    setBusy(false);
    if (!ok) { setMessage(data.error || 'تعذر حفظ التعديل.'); return; }
    setEdit(null);
    setMessage(body.password ? 'تم حفظ البيانات وتغيير كلمة المرور. أرسلها للصحفي بطريقة آمنة.' : 'تم حفظ بيانات الصحفي.');
    load();
  }

  const input = 'w-full rounded-md border border-gray-300 px-3 py-3';
  return <div className="space-y-6">
    <div><h1 className="text-2xl font-extrabold">إدارة الصحفيين</h1><p className="mt-1 text-sm text-muted">إنشاء حسابات الصحفيين وتعديلها وتغيير كلمة المرور وإيقافها أو تفعيلها.</p></div>

    <form onSubmit={create} autoComplete="off" className="grid gap-3 rounded-md bg-mist p-4 md:grid-cols-3">
      <input className={input} name="journalist-name" autoComplete="off" placeholder="اسم الصحفي" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
      <input className={input} name="journalist-email" type="email" dir="ltr" autoComplete="off" placeholder="البريد الإلكتروني للصحفي" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
      <input className={input} name="journalist-password" type="password" dir="ltr" autoComplete="new-password" minLength={8} placeholder="كلمة مرور مؤقتة (8 أحرف على الأقل)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
      <button disabled={busy} className="rounded-md bg-brand px-5 py-3 font-bold text-white disabled:opacity-60 md:col-span-3">{busy ? 'جارٍ الحفظ…' : '+ إنشاء حساب صحفي'}</button>
    </form>

    {message && <p role="status" className="rounded-md border p-3 text-sm font-bold">{message}</p>}

    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-right text-sm">
        <thead className="bg-mist"><tr>
          <th className="p-3">الاسم</th><th className="p-3">البريد</th><th className="p-3">الحالة</th>
          <th className="p-3">الأخبار</th><th className="p-3">المنشورة</th><th className="p-3">المشاهدات</th><th className="p-3">الإجراء</th>
        </tr></thead>
        <tbody className="divide-y">
          {items.map((item) => (
            <Fragment key={item.id}>
              <tr>
                <td className="p-3 font-bold">{item.full_name}</td>
                <td className="p-3" dir="ltr">{item.email}</td>
                <td className="p-3">{item.is_active ? 'نشط' : 'موقوف'}</td>
                <td className="p-3">{num(item.articles_count)}</td>
                <td className="p-3">{num(item.published_count)}</td>
                <td className="p-3 font-bold text-brand">{num(item.views_total)}</td>
                <td className="p-3"><div className="flex flex-wrap gap-2">
                  <button onClick={() => setEdit({ id: item.id, full_name: item.full_name || '', email: item.email || '', password: '' })} className="rounded bg-mist px-3 py-2 font-bold">تعديل</button>
                  <button onClick={() => toggle(item)} className="rounded bg-mist px-3 py-2 font-bold">{item.is_active ? 'إيقاف' : 'تفعيل'}</button>
                </div></td>
              </tr>
              {edit?.id === item.id && (
                <tr><td colSpan={7} className="bg-mist p-4">
                  <form onSubmit={saveEdit} autoComplete="off" className="grid gap-3 md:grid-cols-3">
                    <input className={input} name="edit-name" autoComplete="off" placeholder="الاسم" value={edit.full_name} onChange={(e) => setEdit({ ...edit, full_name: e.target.value })} required />
                    <input className={input} name="edit-email" type="email" dir="ltr" autoComplete="off" placeholder="البريد" value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} required />
                    <input className={input} name="edit-password" type="password" dir="ltr" autoComplete="new-password" minLength={8} placeholder="كلمة مرور جديدة (اتركها فارغة لعدم التغيير)" value={edit.password} onChange={(e) => setEdit({ ...edit, password: e.target.value })} />
                    <p className="text-xs text-muted md:col-span-3">تغيير الاسم لا يغيّر الاسم المسجل على الأخبار المنشورة سابقًا، بل على الأخبار الجديدة فقط.</p>
                    <div className="flex gap-3 md:col-span-3">
                      <button disabled={busy} className="rounded-md bg-brand px-5 py-3 font-bold text-white disabled:opacity-60">حفظ</button>
                      <button type="button" onClick={() => setEdit(null)} className="rounded-md bg-white px-5 py-3 font-bold">إلغاء</button>
                    </div>
                  </form>
                </td></tr>
              )}
            </Fragment>
          ))}
          {!items.length && <tr><td className="p-5 text-center text-muted" colSpan={7}>لا توجد حسابات صحفيين حتى الآن.</td></tr>}
        </tbody>
      </table>
    </div>
  </div>;
}
