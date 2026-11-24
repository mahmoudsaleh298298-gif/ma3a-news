# مع المشجع | نيوز

موقع أخبار رياضية: Next.js 14 + Tailwind، قاعدة بيانات **Neon (Postgres)**، صور **Cloudinary**، دخول مدمج في الموقع.

## متغيرات البيئة (Vercel > Settings > Environment Variables)
| المتغير | الوصف |
|---|---|
| `DATABASE_URL` | رابط الاتصال (Pooled connection) من Neon |
| `AUTH_SECRET` | نص عشوائي سري من 32 حرفًا فأكثر (لتوقيع جلسات الدخول) |
| `SETUP_KEY` | مفتاح لمرة واحدة لإنشاء أول مدير من `/admin/setup` |
| `CLOUDINARY_CLOUD_NAME` | اسم السحابة في Cloudinary |
| `CLOUDINARY_API_KEY` | مفتاح API في Cloudinary |
| `CLOUDINARY_API_SECRET` | السر في Cloudinary (لا يصل للمتصفح أبدًا) |
| `NEXT_PUBLIC_SITE_URL` | `https://www.ma3a-news.com` |

## قاعدة البيانات
الهيكل في `db/schema.sql`. لا توجد صلاحيات على مستوى الصفوف؛ كل الصلاحيات تُفحص في الخادم (`/app/api`).

## الأدوار
admin (مدير) · chief (رئيس تحرير) · editor (محرر) · writer (صحفي: يرى ويعدّل أخباره فقط، ولا يضع «عاجل» أو «تثبيت») · viewer (مشاهد).

## أول تشغيل
1. افتح `/admin/setup` وأنشئ أول مدير (يحتاج `SETUP_KEY`)، وتظهر الصفحة مرة واحدة فقط.
2. من `/admin/users` أضف الصحفيين أو اربطهم بملفاتهم القديمة.
