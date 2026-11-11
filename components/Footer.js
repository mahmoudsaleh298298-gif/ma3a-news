export default function Footer() {
  return (
    <footer className="mt-12 bg-brand-dark py-8 text-center text-sm text-white">
      <p className="text-lg font-extrabold">مع المشجع | نيوز</p>
      <p className="mt-1 opacity-90">رياضة .. من قلب الجماهير</p>
      <p className="mt-3 text-xs opacity-75">© {new Date().getFullYear()} جميع الحقوق محفوظة</p>
    </footer>
  );
}
