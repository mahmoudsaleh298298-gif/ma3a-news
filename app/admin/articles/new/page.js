import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { allCategories } from '@/lib/queries';
import ArticleForm from '@/components/ArticleForm';

export const dynamic = 'force-dynamic';

export default async function NewArticle() {
  const user = await getSession();
  if (!user || user.role === 'viewer') redirect('/admin');
  const categories = await allCategories();
  return <ArticleForm categories={categories} isWriter={user.role === 'writer'} />;
}
