import { notFound, redirect } from 'next/navigation';
import { row } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { allCategories } from '@/lib/queries';
import { UUID } from '@/lib/guard';
import ArticleForm from '@/components/ArticleForm';

export const dynamic = 'force-dynamic';

export default async function EditArticle({ params }) {
  const user = await getSession();
  if (!user || user.role === 'viewer') redirect('/admin');
  if (!UUID.test(params.id)) notFound();
  const [article, categories] = await Promise.all([
    row(`SELECT * FROM public.articles WHERE id = $1`, [params.id]),
    allCategories(),
  ]);
  if (!article) notFound();
  const isWriter = user.role === 'writer';
  if (isWriter && article.author_id !== user.id) notFound();
  return <ArticleForm article={article} categories={categories} isWriter={isWriter} />;
}
