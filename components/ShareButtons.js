export default function ShareButtons({ url, title }) {
  const u = encodeURIComponent(url), t = encodeURIComponent(title);
  const cls = 'rounded-full bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-dark';
  return (
    <div className="flex flex-wrap gap-2">
      <a className={cls} target="_blank" rel="noopener noreferrer" href={`https://www.facebook.com/sharer/sharer.php?u=${u}`}>فيسبوك</a>
      <a className={cls} target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${t}%20${u}`}>واتساب</a>
      <a className={cls} target="_blank" rel="noopener noreferrer" href={`https://twitter.com/intent/tweet?url=${u}&text=${t}`}>X</a>
    </div>
  );
}
