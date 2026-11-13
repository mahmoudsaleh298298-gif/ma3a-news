/** @type {import('next').NextConfig} */
const host = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : 'localhost';
export default {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [{ protocol: 'https', hostname: host }],
    // أسماء ملفات الصور فريدة ولا تتغير، فيمكن حفظ النسخ المحسّنة 30 يومًا.
    // كان الافتراضي 60 ثانية فقط، فكانت كل صورة تُجلب من Supabase مرارًا (سبب استهلاك الحصة).
    minimumCacheTTL: 2592000,
    // مقاسات أقل = نسخ محسّنة أقل = طلبات أقل إلى Supabase
    deviceSizes: [640, 828, 1200, 1600],
    imageSizes: [96, 160, 256, 384],
  },
};
