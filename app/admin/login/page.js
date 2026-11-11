'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { browserClient } from '@/lib/supabase/browser';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    const { error } = await browserClient().auth.signInWithPassword({ email, password });
    if (error) { setError('البريد الإلكتروني أو كلمة المرور غير صحيحة.'); setBusy(false); return; }
    router.replace('/admin'); router.refresh();
  }

  return (
    <form onSubmit={submit} className="mx-auto mt-10 max-w-sm space-y-4 rounded-md bg-mist p-6">
      <h1 className="text-2xl font-extrabold text-brand">دخول لوحة التحكم</h1>
      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="البريد الإلكتروني" dir="ltr"
        className="w-full rounded-md border border-gray-300 px-3 py-3" />
      <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="كلمة المرور" dir="ltr"
        className="w-full rounded-md border border-gray-300 px-3 py-3" />
      {error && <p role="alert" className="text-sm font-bold text-brand">{error}</p>}
      <button disabled={busy} className="w-full rounded-md bg-brand py-3 font-bold text-white hover:bg-brand-dark disabled:opacity-60">
        {busy ? 'جارٍ الدخول…' : 'دخول'}
      </button>
    </form>
  );
}
