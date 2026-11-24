import { getAd, getSetting } from '@/lib/queries';

// يعرض إعلان AdSense فقط إذا تم تفعيل موضع الإعلان وإدخال رقم الناشر في قاعدة البيانات.
export default async function AdSlot({ placement }) {
  const [ad, client] = await Promise.all([
    getAd(placement).catch(() => null),
    getSetting('adsense_client').catch(() => null),
  ]);
  if (!ad || !client) return null;
  return (
    <div className="my-4 text-center" aria-label="إعلان">
      <ins className="adsbygoogle" style={{ display: 'block' }}
        data-ad-client={client} data-ad-slot={ad.slot_id}
        data-ad-format="auto" data-full-width-responsive="true" />
      <script dangerouslySetInnerHTML={{ __html: '(window.adsbygoogle=window.adsbygoogle||[]).push({});' }} />
    </div>
  );
}
