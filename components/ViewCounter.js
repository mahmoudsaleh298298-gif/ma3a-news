'use client';
import { useEffect } from 'react';

// يسجّل مشاهدة واحدة لكل خبر في كل جلسة تصفح (لا يتضاعف مع تحديث الصفحة).
export default function ViewCounter({ id }) {
  useEffect(() => {
    try {
      const k = 'v:' + id;
      if (sessionStorage.getItem(k)) return;
      sessionStorage.setItem(k, '1');
    } catch {}
    fetch(`/api/views/${id}`, { method: 'POST', keepalive: true }).catch(() => {});
  }, [id]);
  return null;
}
