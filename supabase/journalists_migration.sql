-- مع المشجع نيوز: Journalist permissions migration
-- Run once in Supabase SQL Editor after taking a database backup.
BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Disabled accounts receive no application role.
CREATE OR REPLACE FUNCTION public.my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE WHEN COALESCE(p.is_active, true) THEN p.role ELSE NULL END
  FROM public.profiles AS p
  WHERE p.id = auth.uid()
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.my_role() TO anon, authenticated;

-- Enforce journalist identity and protect manager-only fields at the database layer.
CREATE OR REPLACE FUNCTION public.enforce_article_writer_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_name text;
BEGIN
  v_role := public.my_role();

  IF v_role = 'writer' THEN
    SELECT COALESCE(NULLIF(BTRIM(full_name), ''), 'صحفي')
      INTO v_name
    FROM public.profiles
    WHERE id = auth.uid() AND is_active = true;

    IF TG_OP = 'INSERT' THEN
      NEW.author_id := auth.uid();
      NEW.author_name := v_name;
      NEW.is_breaking := false;
      NEW.is_pinned := false;
      NEW.views := 0;
    ELSE
      -- A writer may edit content only; ownership and editorial controls remain unchanged.
      NEW.author_id := OLD.author_id;
      NEW.author_name := OLD.author_name;
      NEW.views := OLD.views;
      NEW.is_breaking := OLD.is_breaking;
      NEW.is_pinned := OLD.is_pinned;
    END IF;
  ELSIF TG_OP = 'INSERT' AND NEW.author_id IS NULL THEN
    NEW.author_id := auth.uid();
  END IF;

  IF TG_OP = 'UPDATE' THEN
    NEW.updated_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS articles_enforce_writer_fields ON public.articles;
CREATE TRIGGER articles_enforce_writer_fields
BEFORE INSERT OR UPDATE ON public.articles
FOR EACH ROW EXECUTE FUNCTION public.enforce_article_writer_fields();

-- Replace only the four known article policies, keeping their names stable.
DROP POLICY IF EXISTS "articles read" ON public.articles;
CREATE POLICY "articles read" ON public.articles
FOR SELECT USING (
  (status = 'published' AND published_at <= now())
  OR public.my_role() IN ('admin','chief','editor')
  OR (public.my_role() = 'writer' AND author_id = auth.uid())
);

DROP POLICY IF EXISTS "articles insert" ON public.articles;
CREATE POLICY "articles insert" ON public.articles
FOR INSERT WITH CHECK (
  public.my_role() IN ('admin','chief','editor','writer')
  AND (public.my_role() <> 'writer' OR author_id = auth.uid())
);

DROP POLICY IF EXISTS "articles update" ON public.articles;
CREATE POLICY "articles update" ON public.articles
FOR UPDATE
USING (
  public.my_role() IN ('admin','chief','editor')
  OR (public.my_role() = 'writer' AND author_id = auth.uid())
)
WITH CHECK (
  public.my_role() IN ('admin','chief','editor')
  OR (public.my_role() = 'writer' AND author_id = auth.uid())
);

-- Writers remain unable to delete; preserve the existing manager/editor policy.
DROP POLICY IF EXISTS "articles delete" ON public.articles;
CREATE POLICY "articles delete" ON public.articles
FOR DELETE USING (public.my_role() IN ('admin','chief','editor'));

-- Ensure profile management is admin-only for both existing and new rows.
DROP POLICY IF EXISTS "profile admin write" ON public.profiles;
CREATE POLICY "profile admin write" ON public.profiles
FOR ALL
USING (public.my_role() = 'admin')
WITH CHECK (public.my_role() = 'admin');

COMMIT;


-- Fix: allow the SECURITY DEFINER view counter to increment views,
-- while preventing writers from changing views directly.
BEGIN;

CREATE OR REPLACE FUNCTION public.enforce_article_writer_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_name text;
  v_is_view_increment boolean;
BEGIN
  v_role := public.my_role();
  v_is_view_increment :=
    COALESCE(current_setting('app.increment_views', true), 'off') = 'on';

  IF v_role = 'writer' THEN
    SELECT COALESCE(NULLIF(BTRIM(full_name), ''), 'صحفي')
      INTO v_name
    FROM public.profiles
    WHERE id = auth.uid() AND is_active = true;

    IF TG_OP = 'INSERT' THEN
      NEW.author_id := auth.uid();
      NEW.author_name := v_name;
      NEW.is_breaking := false;
      NEW.is_pinned := false;
      NEW.views := 0;
    ELSE
      NEW.author_id := OLD.author_id;
      NEW.author_name := OLD.author_name;
      IF NOT v_is_view_increment THEN
        NEW.views := OLD.views;
      END IF;
      NEW.is_breaking := OLD.is_breaking;
      NEW.is_pinned := OLD.is_pinned;
    END IF;
  ELSIF TG_OP = 'INSERT' AND NEW.author_id IS NULL THEN
    NEW.author_id := auth.uid();
  END IF;

  IF TG_OP = 'UPDATE' AND NOT v_is_view_increment THEN
    NEW.updated_at := now();
  END IF;

  RETURN NEW;
END;
$$;

-- Keep the existing function signature and privileges.
-- The marker is transaction-local and is set only inside this SECURITY DEFINER function.
CREATE OR REPLACE FUNCTION public.increment_views(article_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('app.increment_views', 'on', true);

  UPDATE public.articles
  SET views = COALESCE(views, 0) + 1
  WHERE id = article_id;

  PERFORM set_config('app.increment_views', 'off', true);
EXCEPTION
  WHEN OTHERS THEN
    PERFORM set_config('app.increment_views', 'off', true);
    RAISE;
END;
$$;

COMMIT;
