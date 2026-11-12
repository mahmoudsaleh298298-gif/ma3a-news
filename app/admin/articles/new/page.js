import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import ArticleForm from '@/components/ArticleForm';

export const dynamic = 'force-dynamic';

export default async function NewArticle() {
  const store = cookies();
  const db = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: { getAll: () => store.getAll(), setAll() {} },
  });
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect('/admin/login');
  const { data: profile } = await db.from('profiles').select('role,is_active').eq('id', user.id).maybeSingle();
  if (!profile || profile.is_active === false || profile.role === 'viewer') redirect('/admin');
  const { data: categories } = await db.from('categories').select('id,name').order('sort_order');
  return <ArticleForm categories={categories || []} isWriter={profile.role === 'writer'} />;
}
