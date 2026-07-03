import clsx from 'clsx';

type Props = {
  index?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  tone?: 'light' | 'dark';
};

export default function SectionHeading({
  index,
  eyebrow,
  title,
  description,
  align = 'left',
  tone = 'light',
}: Props) {
  const alignCls = align === 'center' ? 'text-center items-center' : 'text-left items-start';
  const titleColor = tone === 'dark' ? 'text-cream-50' : 'text-ink-900';
  const descColor  = tone === 'dark' ? 'text-cream-100/80' : 'text-ink-600';
  const eyebrowColor = tone === 'dark' ? 'text-gold-400' : 'text-gold-600';

  return (
    <div className={clsx('flex flex-col gap-4 mb-10 md:mb-14', alignCls)}>
      <div className="flex items-baseline gap-4">
        {index && (
          <span className={clsx('font-serif italic text-3xl md:text-4xl', eyebrowColor)}>
            {index}
          </span>
        )}
        {eyebrow && (
          <span className={clsx('uppercase tracking-[0.2em] text-xs font-medium', eyebrowColor)}>
            — {eyebrow}
          </span>
        )}
      </div>
      <h2 className={clsx('font-serif text-display-md font-medium', titleColor)}>
        {title}
      </h2>
      {description && (
        <p className={clsx('max-w-2xl text-lg leading-relaxed', descColor, align === 'center' && 'mx-auto')}>
          {description}
        </p>
      )}
    </div>
  );
}
