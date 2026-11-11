import { publicClient } from '@/lib/supabase/public';
import ArticleForm from '@/components/ArticleForm';

export const dynamic = 'force-dynamic';

export default async function NewArticle() {
  const { data: categories } = await publicClient().from('categories').select('id,name').order('sort_order');
  return <ArticleForm categories={categories || []} />;
}
