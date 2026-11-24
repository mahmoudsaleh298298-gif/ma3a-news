// تنظيف وفحص بيانات الخبر القادمة من النموذج.
const str = (v, max) => {
  const s = typeof v === 'string' ? v.trim() : '';
  return s ? s.slice(0, max) : null;
};

export function readArticle(b) {
  const title = str(b.title, 300);
  if (!title) return { error: 'اكتب عنوان الخبر أولًا.' };
  const status = b.status === 'published' ? 'published' : 'draft';
  let categoryId = null;
  if (b.category_id !== '' && b.category_id != null) {
    categoryId = parseInt(b.category_id, 10);
    if (!Number.isInteger(categoryId)) return { error: 'القسم غير صالح.' };
  }
  let publishedAt = null;
  if (b.published_at) {
    const d = new Date(b.published_at);
    if (isNaN(d)) return { error: 'موعد النشر غير صالح.' };
    publishedAt = d.toISOString();
  }
  const image = str(b.image_url, 1000);
  if (image && !/^https:\/\//i.test(image)) return { error: 'رابط الصورة يجب أن يبدأ بـ https://' };
  return {
    value: {
      title,
      summary: str(b.summary, 1000),
      content: typeof b.content === 'string' ? b.content : '',
      image_url: image,
      category_id: categoryId,
      author_name: str(b.author_name, 120),
      keywords: str(b.keywords, 500),
      seo_description: str(b.seo_description, 300),
      is_breaking: !!b.is_breaking,
      is_pinned: !!b.is_pinned,
      status,
      published_at: publishedAt,
    },
  };
}
