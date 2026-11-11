import Link from 'next/link';
import { publicClient } from '@/lib/supabase/public';

export default async function Header() {
  const { data: cats } = await publicClient()
    .from('categories').select('name,slug').eq('show_in_nav', true).order('sort_order');
  const today = new Date().toLocaleDateString('ar-EG', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  return (
    <header className="sticky top-0 z-30 bg-white shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
        <Link href="/" className="leading-tight">
          <span className="block text-2xl font-extrabold text-brand">مع المشجع | نيوز</span>
          <span className="block text-xs text-muted">رياضة .. من قلب الجماهير</span>
        </Link>
        <div className="flex items-center gap-4 text-sm text-muted">
          <span className="hidden md:block">{today}</span>
          <Link href="/search" className="font-bold text-ink hover:text-brand" aria-label="بحث">🔍 بحث</Link>
        </div>
      </div>
      <nav className="bg-brand" aria-label="الأقسام">
        <ul className="mx-auto flex max-w-6xl overflow-x-auto px-2 text-sm font-bold text-white [scrollbar-width:none]">
          <li><Link href="/" className="block whitespace-nowrap px-3 py-3 hover:bg-brand-dark">الرئيسية</Link></li>
          {cats?.map((c) => (
            <li key={c.slug}>
              <Link href={`/category/${c.slug}`} className="block whitespace-nowrap px-3 py-3 hover:bg-brand-dark">{c.name}</Link>
            </li>
          ))}
          <li><Link href="/breaking" className="block whitespace-nowrap px-3 py-3 hover:bg-brand-dark">أخبار عاجلة</Link></li>
        </ul>
      </nav>
    </header>
  );
}
