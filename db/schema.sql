-- هيكل قاعدة البيانات (Neon / Postgres). ملخص لما نُفّذ فعليًا.
CREATE TABLE IF NOT EXISTS public.categories (
  id serial PRIMARY KEY, name text NOT NULL, slug text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0, show_in_nav boolean NOT NULL DEFAULT true, show_on_home boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS public.articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, slug text NOT NULL UNIQUE,
  summary text, content text NOT NULL DEFAULT '', image_url text,
  category_id integer REFERENCES public.categories(id) ON DELETE SET NULL,
  author_name text, status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  published_at timestamptz, updated_at timestamptz NOT NULL DEFAULT now(),
  is_breaking boolean NOT NULL DEFAULT false, is_pinned boolean NOT NULL DEFAULT false,
  keywords text, seo_description text, views integer NOT NULL DEFAULT 0, author_id uuid
);
CREATE INDEX IF NOT EXISTS articles_status_published_at_idx ON public.articles (status, published_at DESC);
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY, full_name text,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin','chief','editor','writer','viewer')),
  is_active boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS public.ads (
  id serial PRIMARY KEY,
  placement text NOT NULL CHECK (placement IN ('top','between_sections','in_article','sidebar')),
  slot_id text NOT NULL, active boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS public.settings (key text PRIMARY KEY, value text);
-- حسابات الدخول (الملف neon_4_users.sql)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY, email text NOT NULL UNIQUE, password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
