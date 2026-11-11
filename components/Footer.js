import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-12 bg-brand-dark py-8 text-center text-sm text-white">
      <p className="text-lg font-extrabold">مع المشجع | نيوز</p>
      <p className="mt-1 opacity-90">رياضة .. من قلب الجماهير</p>
      <nav className="mt-3 flex justify-center gap-5 font-bold" aria-label="روابط الموقع">
        <Link href="/about" className="hover:underline">من نحن</Link>
        <Link href="/contact" className="hover:underline">اتصل بنا</Link>
        <Link href="/privacy" className="hover:underline">سياسة الخصوصية</Link>
      </nav>
      <p className="mt-3 text-xs opacity-75">© {new Date().getFullYear()} جميع الحقوق محفوظة</p>
    </footer>
  );
}
