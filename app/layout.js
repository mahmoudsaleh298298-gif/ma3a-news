import { Cairo } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { publicClient } from '@/lib/supabase/public';
import { SITE_URL, SITE_NAME } from '@/lib/utils';

const cairo = Cairo({ subsets: ['arabic', 'latin'], variable: '--font-cairo', display: 'swap' });

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} — رياضة .. من قلب الجماهير`, template: `%s | ${SITE_NAME}` },
  description: 'أخبار كرة القدم المصرية والعربية والعالمية: الأهلي، الزمالك، بيراميدز، المنتخب والانتقالات.',
  openGraph: { siteName: SITE_NAME, locale: 'ar_EG', type: 'website' },
  twitter: { card: 'summary_large_image' },
};

export const revalidate = 60;

export default async function RootLayout({ children }) {
  const { data: s } = await publicClient().from('settings').select('value').eq('key', 'adsense_client').maybeSingle();
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <head>
        {s?.value && (
          <script async crossOrigin="anonymous"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${s.value}`} />
        )}
      </head>
      <body className="font-sans antialiased">
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-4">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
