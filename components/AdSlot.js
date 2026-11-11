import { publicClient } from '@/lib/supabase/public';

// يعرض إعلان AdSense فقط إذا تم تفعيل موضع الإعلان وإدخال رقم الناشر من لوحة قاعدة البيانات.
export default async function AdSlot({ placement }) {
  const db = publicClient();
  const [{ data: ad }, { data: s }] = await Promise.all([
    db.from('ads').select('slot_id').eq('placement', placement).eq('active', true).limit(1).maybeSingle(),
    db.from('settings').select('value').eq('key', 'adsense_client').maybeSingle(),
  ]);
  if (!ad || !s?.value) return null;
  return (
    <div className="my-4 text-center" aria-label="إعلان">
      <ins className="adsbygoogle" style={{ display: 'block' }}
        data-ad-client={s.value} data-ad-slot={ad.slot_id}
        data-ad-format="auto" data-full-width-responsive="true" />
      <script dangerouslySetInnerHTML={{ __html: '(window.adsbygoogle=window.adsbygoogle||[]).push({});' }} />
    </div>
  );
}
