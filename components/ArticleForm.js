'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { browserClient } from '@/lib/supabase/browser';
import { makeSlug } from '@/lib/utils';

// Compress uploaded editorial images in the browser before sending them to Supabase.
// Keep the untouched original in images/originals/ for archival use, while the
// optimized WebP is the URL used by the public site.
async function makeOptimizedWebp(file, maxSide = 1920, quality = 0.82) {
  if (!file.type.startsWith('image/')) throw new Error('الملف المختار ليس صورة.');
  if (file.size > 20 * 1024 * 1024) throw new Error('حجم الصورة أكبر من 20 ميجابايت.');

  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) throw new Error('تعذر تجهيز الصورة للضغط.');
    context.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
    if (!blob || blob.type !== 'image/webp') throw new Error('المتصفح لا يدعم تحويل الصورة إلى WebP.');
    // Avoid replacing a small source with a larger encoded file.
    if (blob.size >= file.size) return file;
    return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.webp`, { type: 'image/webp', lastModified: Date.now() });
  } finally {
    bitmap?.close?.();
  }
}

const toLocalInput = (d) => {
  const x = d ? new Date(d) : new Date();
  return new Date(x.getTime() - x.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export default function ArticleForm({ article, categories }) {
  const router = useRouter();
  const [f, setF] = useState({
    title: article?.title || '', summary: article?.summary || '', content: article?.content || '',
    image_url: article?.image_url || '', category_id: article?.category_id || '',
    author_name: article?.author_name || '', keywords: article?.keywords || '',
    seo_description: article?.seo_description || '',
    is_breaking: article?.is_breaking || false, is_pinned: article?.is_pinned || false,
    published_at: toLocalInput(article?.published_at),
  });
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  async function upload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setMsg('جارٍ ضغط الصورة وتجهيزها…');
    const db = browserClient();
    const base = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    try {
      const optimized = await makeOptimizedWebp(file);
      const optimizedPath = `${base}${optimized.type === 'image/webp' ? '.webp' : `.${file.name.split('.').pop() || 'img'}`}`;
      const { error: optimizedError } = await db.storage.from('images').upload(optimizedPath, optimized, {
        contentType: optimized.type || file.type,
        cacheControl: '31536000',
        upsert: false,
      });
      if (optimizedError) throw optimizedError;

      // Preserve the uploaded source file for future reprocessing; the public
      // article uses only the optimized file URL above.
      const originalExt = file.name.split('.').pop()?.toLowerCase() || 'img';
      const originalPath = `originals/${base}.${originalExt}`;
      const { error: originalError } = await db.storage.from('images').upload(originalPath, file, {
        contentType: file.type,
        cacheControl: '31536000',
        upsert: false,
      });
      if (originalError) {
        // The optimized file is already uploaded and usable. Warn without
        // discarding the article image if archival upload is denied.
        setMsg('تم رفع الصورة المحسّنة، لكن تعذر حفظ النسخة الأصلية: ' + originalError.message);
      } else {
        const savedPercent = Math.max(0, Math.round((1 - optimized.size / file.size) * 100));
        setMsg(`تم رفع الصورة وتحسينها${optimized.type === 'image/webp' ? ` (WebP، توفير ${savedPercent}% تقريبًا)` : ''} مع حفظ الأصل.`);
      }
      setF((p) => ({ ...p, image_url: db.storage.from('images').getPublicUrl(optimizedPath).data.publicUrl }));
    } catch (error) {
      setMsg('تعذر تجهيز أو رفع الصورة: ' + (error?.message || 'خطأ غير معروف'));
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  }

  async function save(status) {
    if (!f.title.trim()) { setMsg('اكتب عنوان الخبر أولًا.'); return; }
    setBusy(true); setMsg('');
    const db = browserClient();
    const { data: { user } } = await db.auth.getUser();
    const row = {
      title: f.title.trim(), summary: f.summary || null, content: f.content,
      image_url: f.image_url || null, category_id: f.category_id || null,
      author_name: f.author_name || null, keywords: f.keywords || null,
      seo_description: f.seo_description || null,
      is_breaking: f.is_breaking, is_pinned: f.is_pinned, status,
      published_at: status === 'published' ? new Date(f.published_at).toISOString() : null,
      updated_at: new Date().toISOString(),
    };
    const res = article
      ? await db.from('articles').update(row).eq('id', article.id)
      : await db.from('articles').insert({ ...row, slug: makeSlug(f.title), author_id: user?.id });
    setBusy(false);
    if (res.error) { setMsg('تعذر الحفظ: ' + res.error.message); return; }
    router.push('/admin'); router.refresh();
  }

  const input = 'w-full rounded-md border border-gray-300 px-3 py-3';
  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-2xl font-extrabold">{article ? 'تعديل الخبر' : 'خبر جديد'}</h1>
      <input className={input} placeholder="عنوان الخبر" value={f.title} onChange={set('title')} />
      <textarea className={input} rows={2} placeholder="ملخص قصير" value={f.summary} onChange={set('summary')} />
      <select className={input} value={f.category_id} onChange={set('category_id')}>
        <option value="">اختر القسم</option>
        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <div className="space-y-2 rounded-md bg-mist p-3">
        <label className="block text-sm font-bold">صورة الخبر</label>
        <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={upload} disabled={busy} />
        <p className="text-xs text-muted">تُضغط الصور تلقائيًا إلى WebP وبحد أقصى 1920 بكسل، مع حفظ النسخة الأصلية في مجلد originals.</p>
        <input className={input} dir="ltr" placeholder="أو الصق رابط الصورة" value={f.image_url} onChange={set('image_url')} />
        {f.image_url && <img src={f.image_url} alt="معاينة" className="max-h-48 rounded-md" />}
      </div>
      <textarea className={input} rows={14} value={f.content} onChange={set('content')}
        placeholder={'نص الخبر. افصل الفقرات بسطر فارغ.\n## عنوان فرعي\n> اقتباس\n- عنصر قائمة'} />
      <input className={input} placeholder="اسم الكاتب أو المحرر" value={f.author_name} onChange={set('author_name')} />
      <input className={input} placeholder="كلمات مفتاحية (مفصولة بفواصل)" value={f.keywords} onChange={set('keywords')} />
      <textarea className={input} rows={2} placeholder="وصف SEO (حتى 160 حرفًا)" maxLength={200} value={f.seo_description} onChange={set('seo_description')} />
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={f.is_breaking} onChange={set('is_breaking')} /> خبر عاجل</label>
        <label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={f.is_pinned} onChange={set('is_pinned')} /> تثبيت في الرئيسية</label>
      </div>
      <div>
        <label className="mb-1 block text-sm font-bold">موعد النشر (اختر وقتًا مستقبليًا للجدولة)</label>
        <input type="datetime-local" className={input} value={f.published_at} onChange={set('published_at')} />
      </div>
      {msg && <p role="status" className="font-bold text-brand">{msg}</p>}
      <div className="flex gap-3">
        <button disabled={busy} onClick={() => save('published')} className="flex-1 rounded-md bg-brand py-3 font-bold text-white hover:bg-brand-dark disabled:opacity-60">نشر</button>
        <button disabled={busy} onClick={() => save('draft')} className="flex-1 rounded-md bg-mist py-3 font-bold disabled:opacity-60">حفظ مسودة</button>
      </div>
    </div>
  );
}
