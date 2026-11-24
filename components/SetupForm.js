'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SetupForm() {
  const router = useRouter();
  const [f, setF] = useState({ key: '', name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    const res = await fetch('/api/auth/setup', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f),
    });
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error || 'تعذر الإعداد.');
      setBusy(false);
      return;
    }
    router.replace('/admin'); router.refresh();
  }

  const input = 'w-full rounded-md border border-gray-300 px-3 py-3';
  return (
    <form onSubmit={submit} className="mx-auto mt-10 max-w-sm space-y-4 rounded-md bg-mist p-6">
      <h1 className="text-2xl font-extrabold text-brand">إنشاء أول مدير</h1>
      <p className="text-sm text-muted">تظهر هذه الصفحة مرة واحدة فقط، قبل إنشاء أي حساب.</p>
      <input required value={f.key} onChange={set('key')} placeholder="مفتاح الإعداد (SETUP_KEY)" dir="ltr" className={input} />
      <input value={f.name} onChange={set('name')} placeholder="الاسم" className={input} />
      <input type="email" required value={f.email} onChange={set('email')} placeholder="البريد الإلكتروني" dir="ltr" className={input} />
      <input type="password" required minLength={8} value={f.password} onChange={set('password')} placeholder="كلمة المرور (8 أحرف على الأقل)" dir="ltr" className={input} />
      {error && <p role="alert" className="text-sm font-bold text-brand">{error}</p>}
      <button disabled={busy} className="w-full rounded-md bg-brand py-3 font-bold text-white hover:bg-brand-dark disabled:opacity-60">
        {busy ? 'جارٍ الإنشاء…' : 'إنشاء الحساب'}
      </button>
    </form>
  );
}
