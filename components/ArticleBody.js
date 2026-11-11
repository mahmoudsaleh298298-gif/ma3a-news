// يحوّل نص الخبر إلى عناصر آمنة: ## عنوان فرعي، > اقتباس، - قائمة، سطر فارغ = فقرة جديدة.
export default function ArticleBody({ text }) {
  const blocks = (text || '').split(/\n{2,}/);
  return (
    <div className="space-y-4 text-lg leading-9 text-ink">
      {blocks.map((b, i) => {
        const t = b.trim();
        if (!t) return null;
        if (t.startsWith('## ')) return <h2 key={i} className="pt-2 text-2xl font-extrabold">{t.slice(3)}</h2>;
        if (t.startsWith('> ')) return <blockquote key={i} className="border-r-4 border-brand bg-mist px-4 py-3 font-bold">{t.slice(2)}</blockquote>;
        if (t.split('\n').every((l) => l.startsWith('- ')))
          return <ul key={i} className="list-disc pr-6">{t.split('\n').map((l, j) => <li key={j}>{l.slice(2)}</li>)}</ul>;
        return <p key={i}>{t}</p>;
      })}
    </div>
  );
}
