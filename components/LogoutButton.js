'use client';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();
  async function out() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/admin/login'); router.refresh();
  }
  return <button onClick={out} className="rounded-md bg-mist px-4 py-2 text-sm font-bold">تسجيل الخروج</button>;
}
