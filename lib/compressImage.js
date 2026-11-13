// يصغّر الصورة ويضغطها داخل المتصفح قبل رفعها:
// الحد الأقصى للعرض 1600 بكسل، وصيغة WebP (أو JPEG إن لم يدعم المتصفح WebP)،
// والهدف أن لا يتجاوز الحجم نحو 350 كيلوبايت.
const TARGET_BYTES = 350 * 1024;
const MAX_INPUT_BYTES = 20 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

async function decode(file) {
  if (typeof createImageBitmap === 'function') {
    try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch {}
  }
  return await new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('decode')); };
    img.src = url;
  });
}

function toBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function compressImage(file) {
  if (!ALLOWED.includes(file.type)) throw new Error('نوع الصورة غير مدعوم. ارفع صورة JPG أو PNG أو WebP.');
  if (file.size > MAX_INPUT_BYTES) throw new Error('حجم الصورة كبير جدًا (الحد 20 ميجابايت).');

  let img;
  try { img = await decode(file); } catch { throw new Error('تعذر قراءة الصورة. جرّب صورة أخرى.'); }
  const srcW = img.width;
  const srcH = img.height;

  // صورة صغيرة أصلًا: تُرفع كما هي
  if (file.size <= TARGET_BYTES && srcW <= 1600) {
    img.close?.();
    return { blob: file, type: file.type, ext: file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg', width: srcW, height: srcH };
  }

  let best = null;
  for (const maxW of [1600, 1280, 1024]) {
    const scale = Math.min(1, maxW / srcW);
    const w = Math.max(1, Math.round(srcW * scale));
    const h = Math.max(1, Math.round(srcH * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    for (const q of [0.82, 0.72, 0.62]) {
      let blob = await toBlob(canvas, 'image/webp', q);
      let type = 'image/webp';
      let ext = 'webp';
      if (!blob || blob.type !== 'image/webp') {
        blob = await toBlob(canvas, 'image/jpeg', q);
        type = 'image/jpeg';
        ext = 'jpg';
      }
      if (!blob) continue;
      best = { blob, type, ext, width: w, height: h };
      if (blob.size <= TARGET_BYTES) { img.close?.(); return best; }
    }
  }
  img.close?.();
  if (!best) throw new Error('تعذر معالجة الصورة.');
  return best;
}
