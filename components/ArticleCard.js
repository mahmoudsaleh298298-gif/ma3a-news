import Link from 'next/link';
import Image from 'next/image';
import { fmtDateTime } from '@/lib/utils';

export function Thumb({ src, alt, sizes, priority }) {
  return src ? (
    <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
  ) : (
    <div className="absolute inset-0 grid place-items-center bg-brand-dark text-white font-extrabold text-lg">
      مع المشجع
    </div>
  );
}

export default function ArticleCard({ a, row = false }) {
  const href = `/news/${a.slug}`;
  return (
    <article className={row ? 'flex gap-3' : 'block'}>
      <Link href={href} className={`relative block overflow-hidden rounded-md bg-mist ${row ? 'w-28 h-20 shrink-0 sm:w-40 sm:h-28' : 'aspect-video'}`}>
        <Thumb src={a.image_url} alt={a.title} sizes="(max-width:640px) 50vw, 25vw" />
      </Link>
      <div className={row ? 'min-w-0' : 'pt-2'}>
        {a.categories && (
          <Link href={`/category/${a.categories.slug}`} className="text-xs font-bold text-brand">
            {a.categories.name}
          </Link>
        )}
        <h3 className="font-bold leading-snug text-ink">
          <Link href={href} className="hover:text-brand">{a.title}</Link>
        </h3>
        {a.author_name && <p className="mt-0.5 text-xs font-bold text-muted">بقلم: {a.author_name}</p>}
        {!row && a.summary && <p className="mt-1 text-sm text-muted line-clamp-2">{a.summary}</p>}
        <time className="mt-1 block text-xs text-muted">{fmtDateTime(a.published_at)}</time>
      </div>
    </article>
  );
}
