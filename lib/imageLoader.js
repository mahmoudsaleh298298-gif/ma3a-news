// يطلب من Cloudinary نسخة بعرض مناسب وبأفضل صيغة وجودة تلقائيًا.
// أي رابط ليس من Cloudinary يُرجَع كما هو.
export default function imageLoader({ src, width }) {
  const m = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/.exec(src || '');
  if (!m) return src;
  const id = m[2].replace(/\.(webp|jpe?g|png|avif)$/i, '');
  return `${m[1]}f_auto,q_auto,c_limit,w_${width}/${id}`;
}
