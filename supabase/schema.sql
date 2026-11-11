-- مع المشجع | نيوز — قاعدة البيانات. شغّل الملف كاملًا في Supabase > SQL Editor.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'viewer'
    check (role in ('admin','chief','editor','writer','viewer'))
);

create table public.categories (
  id serial primary key,
  name text not null,
  slug text not null unique,
  sort_order int not null default 0,
  show_in_nav boolean not null default true,
  show_on_home boolean not null default true
);

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  summary text,
  content text not null default '',
  image_url text,
  category_id int references public.categories(id) on delete set null,
  author_name text,
  status text not null default 'draft' check (status in ('draft','published')),
  published_at timestamptz,
  updated_at timestamptz not null default now(),
  is_breaking boolean not null default false,
  is_pinned boolean not null default false,
  keywords text,
  seo_description text,
  views int not null default 0,
  author_id uuid references auth.users(id)
);
create index on public.articles (status, published_at desc);

create table public.ads (
  id serial primary key,
  placement text not null check (placement in ('top','between_sections','in_article','sidebar')),
  slot_id text not null,
  active boolean not null default true
);

create table public.settings (
  key text primary key,
  value text
);

-- صلاحيات
create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as
$$ select role from public.profiles where id = auth.uid() $$;

alter table public.profiles   enable row level security;
alter table public.categories enable row level security;
alter table public.articles   enable row level security;
alter table public.ads        enable row level security;
alter table public.settings   enable row level security;

create policy "profile self read" on public.profiles for select using (id = auth.uid() or public.my_role() = 'admin');
create policy "profile admin write" on public.profiles for all using (public.my_role() = 'admin');

create policy "categories read" on public.categories for select using (true);
create policy "categories write" on public.categories for all
  using (public.my_role() in ('admin','chief')) with check (public.my_role() in ('admin','chief'));

create policy "articles read" on public.articles for select using (
  (status = 'published' and published_at <= now())
  or public.my_role() in ('admin','chief','editor','writer')
);
create policy "articles insert" on public.articles for insert
  with check (public.my_role() in ('admin','chief','editor','writer'));
create policy "articles update" on public.articles for update
  using (public.my_role() in ('admin','chief','editor') or (public.my_role() = 'writer' and author_id = auth.uid()));
create policy "articles delete" on public.articles for delete
  using (public.my_role() in ('admin','chief','editor'));

create policy "ads read" on public.ads for select using (true);
create policy "ads write" on public.ads for all
  using (public.my_role() in ('admin','chief')) with check (public.my_role() in ('admin','chief'));
create policy "settings read" on public.settings for select using (true);
create policy "settings write" on public.settings for all
  using (public.my_role() = 'admin') with check (public.my_role() = 'admin');

-- إنشاء ملف المستخدم تلقائيًا عند التسجيل
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as
$$ begin insert into public.profiles (id) values (new.id); return new; end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- عدّاد المشاهدات
create or replace function public.increment_views(article_id uuid) returns void
language sql security definer set search_path = public as
$$ update public.articles set views = views + 1 where id = article_id and status = 'published' $$;
grant execute on function public.increment_views(uuid) to anon, authenticated;

-- تخزين الصور
insert into storage.buckets (id, name, public) values ('images', 'images', true) on conflict do nothing;
create policy "images public read" on storage.objects for select using (bucket_id = 'images');
create policy "images staff upload" on storage.objects for insert
  with check (bucket_id = 'images' and public.my_role() in ('admin','chief','editor','writer'));

-- الأقسام الأساسية
insert into public.categories (name, slug, sort_order) values
 ('الأهلي','ahly',1),('الزمالك','zamalek',2),('بيراميدز','pyramids',3),
 ('الكرة المصرية','egyptian-football',4),('المنتخب المصري','national-team',5),
 ('الدوري المصري','egyptian-league',6),('دوري أبطال إفريقيا','caf-champions-league',7),
 ('الكرة العربية','arab-football',8),('الكرة العالمية','world-football',9),
 ('المحترفون المصريون','egyptian-pros',10),('انتقالات اللاعبين','transfers',11),
 ('فيديو','video',12);

-- أخبار تجريبية واضحة التسمية — احذفها من لوحة التحكم قبل الإطلاق
insert into public.articles (title, slug, summary, content, category_id, author_name, status, published_at, is_pinned, is_breaking)
select 'خبر تجريبي: هذا مثال لخبر رئيسي', 'demo-1-' || c.slug,
  'هذا الخبر تجريبي لاختبار تصميم الموقع، احذفه من لوحة التحكم.',
  E'## عنوان فرعي\n\nهذه فقرة تجريبية لاختبار شكل المقال.\n\n> اقتباس تجريبي\n\n- نقطة أولى\n- نقطة ثانية',
  c.id, 'فريق التحرير', 'published', now() - (c.sort_order || ' hours')::interval,
  c.sort_order = 1, c.sort_order <= 2
from public.categories c where c.sort_order <= 6;
