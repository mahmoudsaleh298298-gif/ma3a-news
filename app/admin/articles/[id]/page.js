import { notFound } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import ArticleForm from '@/components/ArticleForm';

export const dynamic = 'force-dynamic';

export default async function EditArticle({ params }) {
  const store = cookies();
  const db = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: { getAll: () => store.getAll(), setAll() {} },
  });
  const [{ data: article }, { data: categories }] = await Promise.all([
    db.from('articles').select('*').eq('id', params.id).maybeSingle(),
    db.from('categories').select('id,name').order('sort_order'),
  ]);
  if (!article) notFound();
  return <ArticleForm article={article} categories={categories || []} />;
}
