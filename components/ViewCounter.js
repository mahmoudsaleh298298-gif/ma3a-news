'use client';
import { useEffect } from 'react';
import { browserClient } from '@/lib/supabase/browser';

// يسجّل مشاهدة واحدة لكل خبر في كل جلسة تصفح (لا يتضاعف مع تحديث الصفحة).
export default function ViewCounter({ id }) {
  useEffect(() => {
    try {
      const k = 'v:' + id;
      if (sessionStorage.getItem(k)) return;
      sessionStorage.setItem(k, '1');
    } catch {}
    browserClient().rpc('increment_views', { article_id: id }).then(() => {});
  }, [id]);
  return null;
}
