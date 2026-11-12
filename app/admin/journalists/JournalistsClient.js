'use client';
import { useEffect, useState } from 'react';

export default function JournalistsPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ full_name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function load() {
    const res = await fetch('/api/admin/journalists');
    const data = await res.json();
    if (!res.ok) { setMessage(data.error || 'تعذر تحميل الصحفيين.'); return; }
    setItems(data.journalists || []);
  }
  useEffect(() => { load(); }, []);

  async function create(e) {
    e.preventDefault(); setBusy(true); setMessage('');
    const res = await fetch('/api/admin/journalists', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await res.json(); setBusy(false);
    if (!res.ok) { setMessage(data.error || 'تعذر إنشاء الحساب.'); return; }
    setForm({ full_name: '', email: '', password: '' });
    setMessage('تم إنشاء حساب الصحفي بنجاح. أرسل له البريد وكلمة المرور بطريقة آمنة.');
    load();
  }

  async function toggle(item) {
    const next = !item.is_active;
    if (!confirm(next ? 'إعادة تفعيل حساب الصحفي؟' : 'إيقاف حساب الصحفي؟')) return;
    const res = await fetch('/api/admin/journalists', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item.id, is_active: next }) });
    const data = await res.json();
    if (!res.ok) { setMessage(data.error || 'تعذر تحديث الحساب.'); return; }
    setItems((old) => old.map((x) => x.id === item.id ? { ...x, is_active: next } : x));
  }

  const input = 'w-full rounded-md border border-gray-300 px-3 py-3';
  return <div className="space-y-6">
    <div><h1 className="text-2xl font-extrabold">إدارة الصحفيين</h1><p className="mt-1 text-sm text-muted">إنشاء حسابات الصحفيين وتفعيلها أو إيقافها.</p></div>
    <form onSubmit={create} className="grid gap-3 rounded-md bg-mist p-4 md:grid-cols-3">
      <input className={input} placeholder="اسم الصحفي" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
      <input className={input} type="email" dir="ltr" placeholder="البريد الإلكتروني" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
      <input className={input} type="password" dir="ltr" minLength={8} placeholder="كلمة مرور مؤقتة (8 أحرف على الأقل)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
      <button disabled={busy} className="rounded-md bg-brand px-5 py-3 font-bold text-white disabled:opacity-60 md:col-span-3">{busy ? 'جارٍ إنشاء الحساب…' : '+ إنشاء حساب صحفي'}</button>
    </form>
    {message && <p role="status" className="rounded-md border p-3 text-sm font-bold">{message}</p>}
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-right text-sm"><thead className="bg-mist"><tr><th className="p-3">الاسم</th><th className="p-3">البريد</th><th className="p-3">الحالة</th><th className="p-3">الإجراء</th></tr></thead>
      <tbody className="divide-y">{items.map((item) => <tr key={item.id}><td className="p-3 font-bold">{item.full_name}</td><td className="p-3" dir="ltr">{item.email}</td><td className="p-3">{item.is_active ? 'نشط' : 'موقوف'}</td><td className="p-3"><button onClick={() => toggle(item)} className="rounded bg-mist px-3 py-2 font-bold">{item.is_active ? 'إيقاف' : 'تفعيل'}</button></td></tr>)}
      {!items.length && <tr><td className="p-5 text-center text-muted" colSpan={4}>لا توجد حسابات صحفيين حتى الآن.</td></tr>}</tbody></table>
    </div>
  </div>;
}
