-- مع المشجع نيوز — إصلاحات نظام الصحفيين (تشغيل مرة واحدة)
-- شغّله على قاعدة التجربة أولًا، وبعد أخذ نسخة احتياطية من جدول articles.
-- لا يحذف ولا يعدّل أي بيانات؛ يستبدل دالتين فقط (CREATE OR REPLACE).
BEGIN;

-- 1) حماية إضافية للصحفي في قاعدة البيانات:
--    - لا يغيّر رابط الخبر (slug).
--    - إذا كان الخبر منشورًا من قبل، يبقى تاريخ نشره كما هو.
--    - عند النشر لأول مرة يُسجَّل تاريخ النشر = الآن (لا جدولة ولا تاريخ مزيف).
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
      IF NEW.status = 'published' THEN NEW.published_at := now(); END IF;
    ELSE
      NEW.author_id := OLD.author_id;
      NEW.author_name := OLD.author_name;
      NEW.slug := OLD.slug;
      IF NOT v_is_view_increment THEN
        NEW.views := OLD.views;
      END IF;
      NEW.is_breaking := OLD.is_breaking;
      NEW.is_pinned := OLD.is_pinned;
      IF NEW.status = 'published' THEN
        IF OLD.status = 'published' AND OLD.published_at IS NOT NULL THEN
          NEW.published_at := OLD.published_at;
        ELSE
          NEW.published_at := now();
        END IF;
      END IF;
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

-- 2) إعادة شرط status = 'published' إلى عدّاد المشاهدات
--    (كان موجودًا في النسخة الأصلية وسقط في ترحيل الصحفيين).
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
  WHERE id = article_id AND status = 'published';

  PERFORM set_config('app.increment_views', 'off', true);
EXCEPTION
  WHEN OTHERS THEN
    PERFORM set_config('app.increment_views', 'off', true);
    RAISE;
END;
$$;

COMMIT;
