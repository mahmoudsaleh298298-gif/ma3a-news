import { Pool, types } from 'pg';

// تواريخ بصيغة ISO نصية (مثل ما كان يرجعه Supabase) وأعداد صحيحة بدل النصوص
function parseTs(v) {
  if (v == null) return v;
  let s = String(v).replace(' ', 'T');
  if (/[+-]\d\d$/.test(s)) s += ':00';
  const d = new Date(s);
  return isNaN(d) ? v : d.toISOString();
}
types.setTypeParser(1184, parseTs); // timestamptz
types.setTypeParser(20, (v) => parseInt(v, 10)); // bigint (مثل count)

const g = globalThis;
function pool() {
  if (!g.__ma3aPool) {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL غير مضبوط في متغيرات البيئة');
    g.__ma3aPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 3,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 15000,
    });
  }
  return g.__ma3aPool;
}

export async function rows(text, params = []) {
  return (await pool().query(text, params)).rows;
}
export async function row(text, params = []) {
  return (await rows(text, params))[0] || null;
}
export async function tx(fn) {
  const c = await pool().connect();
  try {
    await c.query('BEGIN');
    const out = await fn(c);
    await c.query('COMMIT');
    return out;
  } catch (e) {
    try { await c.query('ROLLBACK'); } catch {}
    throw e;
  } finally {
    c.release();
  }
}
