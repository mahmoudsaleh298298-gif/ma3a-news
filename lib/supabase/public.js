import { createClient } from '@supabase/supabase-js';

// عميل للقراءة العامة (بدون جلسة) — يسمح بالتخزين المؤقت للصفحات.
export function publicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } }
  );
}
