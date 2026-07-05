import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import clsx from 'clsx';

type Props = {
  title: string;
  href?: string;
  tone?: 'light' | 'dark';
  className?: string;
};

export default function SectionHeading({
  title, href, tone = 'light', className,
}: Props) {
  const color = tone === 'dark' ? 'text-white' : 'text-brand-700';

  const content = (
    <h2 className={clsx('font-bold text-2xl md:text-3xl tracking-tight inline-flex items-center gap-2', color)}>
      {title}
      {href && <ChevronRight className="h-6 w-6 opacity-70" strokeWidth={2.5} />}
    </h2>
  );

  return (
    <div className={clsx('mb-6 md:mb-8', className)}>
      {href ? (
        <Link href={href} className="group">
          <span className="group-hover:opacity-80 transition-opacity">{content}</span>
        </Link>
      ) : (
        content
      )}
    </div>
  );
}
