# مع المشجع | نيوز

موقع أخبار رياضية (Next.js 14 + Tailwind + Supabase). واجهة عربية RTL بهوية حمراء وبيضاء.

## التشغيل
1. أنشئ مشروعًا في supabase.com ثم افتح SQL Editor وشغّل محتوى `supabase/schema.sql` كاملًا.
2. انسخ `.env.example` إلى `.env.local` وضع رابط المشروع ومفتاح anon (Settings > API) وعنوان موقعك.
3. في Supabase > Authentication > Users أنشئ مستخدمًا (بريد وكلمة مرور)، ثم شغّل في SQL Editor:
   `update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'بريدك');`
4. `npm install` ثم `npm run dev` وافتح http://localhost:3000 ، ولوحة التحكم على /admin
5. للنشر: ارفع المشروع إلى GitHub واستورده في Vercel، وأضف نفس المتغيرات الثلاثة.

## ما يعمل الآن
الصفحة الرئيسية (عاجل، خبر رئيسي، آخر الأخبار، أقسام)، صفحة الخبر (NewsArticle وBreadcrumbs وCanonical وOpen Graph)، الأقسام مع تحميل المزيد، البحث النصي، الأخبار العاجلة، sitemap وrobots، لوحة التحكم (دخول، نشر، مسودة، جدولة، تعديل، حذف، رفع صور، عاجل، تثبيت، SEO)، صلاحيات الأدوار على مستوى قاعدة البيانات، عدّاد المشاهدات، أماكن AdSense.

## لم يُبنَ بعد (مراحل لاحقة)
صفحات الأندية، مركز المباريات والنتائج (يحتاج مزود API)، مركز الانتقالات، الإشعارات، اقتراحات البحث الفورية، إدارة المستخدمين والأقسام والإعلانات من واجهة اللوحة (حاليًا عبر Supabase Table Editor)، إحصائيات الزيارات (استخدم Vercel Analytics أو GA مؤقتًا).

## AdSense
أضف في جدول `settings` صفًا: key = `adsense_client` و value = `ca-pub-XXXX`، ثم صفوفًا في جدول `ads` لكل موضع (top, between_sections, in_article, sidebar) مع slot_id.

## الأخبار التجريبية
أخبار seed تبدأ بكلمة «تجريبي» — احذفها من لوحة التحكم قبل الإطلاق.
