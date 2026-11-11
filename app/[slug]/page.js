import { notFound } from 'mahmoudsaleh298298@gmail.com';
import { SITE_URL } from '@/lib/utils';

// عدّل هذه القيم ببياناتك الحقيقية قبل الإطلاق
const CONTACT_EMAIL = 'info@example.com';
const UPDATED = 'نوفمبر 2026';

const P = (t) => ({ type: 'p', t });
const H = (t) => ({ type: 'h', t });
const L = (items) => ({ type: 'ul', items });

const PAGES = {
  about: {
    title: 'من نحن',
    blocks: [
      P('«مع المشجع | نيوز» منصة إخبارية رياضية عربية متخصصة في كرة القدم، تغطي الكرة المصرية والعربية والعالمية، وتحمل شعار «رياضة .. من قلب الجماهير».'),
      H('ماذا نقدم'),
      L(['أخبار الأهلي والزمالك وبيراميدز والمنتخب المصري والدوري المصري.', 'أخبار الكرة العربية والعالمية والمحترفين المصريين.', 'أخبار انتقالات اللاعبين، ومقاطع فيديو وتحليلات من برنامج «مع المشجع».']),
      H('منهجنا التحريري'),
      P('نحرص على نشر الأخبار بوضوح وأمانة، ونفرّق بين الخبر المؤكد والمعلومة غير المؤكدة. وإذا وقع خطأ فإننا نصححه عند التنبيه إليه.'),
      H('تواصل معنا'),
      P(`يسعدنا استقبال ملاحظاتكم واقتراحاتكم على البريد: ${CONTACT_EMAIL}`),
    ],
  },
  contact: {
    title: 'اتصل بنا',
    blocks: [
      P('نرحب برسائلكم واقتراحاتكم وتصحيحاتكم، ونرد عليها بأسرع وقت ممكن.'),
      H('البريد الإلكتروني'),
      P(mahmoudsaleh298298@gmail.com),
      H('مواضيع نتلقاها'),
      L(['تصحيح خبر أو معلومة.', 'اقتراحات لتطوير الموقع.', 'التعاون والإعلانات.', 'طلبات حذف أو تعديل محتوى يخصكم.']),
    ],
  },
  privacy: {
    title: 'سياسة الخصوصية',
    blocks: [
      P(`آخر تحديث: ${UPDATED}`),
      P('نحترم خصوصية زوار موقع «مع المشجع | نيوز». توضح هذه الصفحة ما نجمعه من معلومات وكيف نستخدمه.'),
      H('المعلومات التي نجمعها'),
      L(['بيانات تصفح عامة، مثل نوع المتصفح والصفحات المزارة وتاريخ الزيارة.', 'ملفات تعريف الارتباط (الكوكيز) اللازمة لتشغيل الموقع.', 'أي بيانات ترسلها إلينا طوعًا عبر البريد الإلكتروني.']),
      H('الإعلانات وملفات الكوكيز'),
      P('قد نعرض إعلانات عبر خدمة Google AdSense. تستخدم Google وشركاؤها ملفات تعريف الارتباط لعرض إعلانات بناءً على زياراتك السابقة لموقعنا ومواقع أخرى. يمكنك إدارة إعلانات Google المخصصة أو إيقافها من صفحة إعدادات الإعلانات: adssettings.google.com'),
      P('يمكنك أيضًا ضبط متصفحك لرفض ملفات الكوكيز، مع العلم أن بعض وظائف الموقع قد لا تعمل بشكل كامل.'),
      H('روابط خارجية'),
      P('قد يحتوي الموقع على روابط لمواقع أخرى. لا نتحكم في سياسات خصوصيتها ولا نتحمل مسؤوليتها، ونوصي بمراجعتها.'),
      H('حماية البيانات'),
      P('نتخذ إجراءات معقولة لحماية البيانات، ولا نبيع بياناتك الشخصية لأي جهة.'),
      H('التعديلات'),
      P('قد نحدّث هذه السياسة من وقت لآخر، وسيظهر تاريخ آخر تحديث أعلى الصفحة.'),
      H('التواصل'),
      P(`لأي استفسار عن الخصوصية راسلنا على: ${CONTACT_EMAIL}`),
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(PAGES).map((slug) => ({ slug }));
}

export const dynamicParams = false;

export function generateMetadata({ params }) {
  const p = PAGES[params.slug];
  return p ? { title: p.title, alternates: { canonical: `${SITE_URL}/${params.slug}` } } : {};
}

export default function StaticPage({ params }) {
  const p = PAGES[params.slug];
  if (!p) notFound();
  return (
    <article className="mx-auto max-w-3xl">
      <h1 className="mb-4 border-r-4 border-brand pr-3 text-3xl font-extrabold">{p.title}</h1>
      <div className="space-y-4 text-lg leading-9">
        {p.blocks.map((b, i) =>
          b.type === 'h' ? <h2 key={i} className="pt-2 text-xl font-extrabold text-brand">{b.t}</h2>
          : b.type === 'ul' ? <ul key={i} className="list-disc space-y-1 pr-6">{b.items.map((x, j) => <li key={j}>{x}</li>)}</ul>
          : <p key={i}>{b.t}</p>
        )}
      </div>
    </article>
  );
}
