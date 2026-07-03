import Link from 'next/link';
import clsx from 'clsx';
import { ArrowUpRight } from 'lucide-react';

type Variant = 'primary' | 'outline' | 'ghost' | 'gold';
type Size = 'sm' | 'md' | 'lg';

type Props = {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: Variant;
  size?: Size;
  arrow?: boolean;
  className?: string;
  disabled?: boolean;
};

const base = 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 ease-out-editorial rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gold-500 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap';

const variants: Record<Variant, string> = {
  primary: 'bg-ink-900 text-cream-50 hover:bg-ink-800 hover:shadow-card',
  outline: 'border border-ink-900 text-ink-900 hover:bg-ink-900 hover:text-cream-50',
  ghost:   'text-ink-700 hover:text-gold-600',
  gold:    'bg-gold-500 text-ink-900 hover:bg-gold-600 hover:shadow-card',
};

const sizes: Record<Size, string> = {
  sm: 'text-sm px-4 py-2',
  md: 'text-base px-6 py-3',
  lg: 'text-base md:text-lg px-8 py-4',
};

export default function Button({
  children, href, onClick, type = 'button',
  variant = 'primary', size = 'md', arrow, className, disabled,
}: Props) {
  const classes = clsx(base, variants[variant], sizes[size], className);
  const content = (
    <>
      {children}
      {arrow && <ArrowUpRight className="h-4 w-4 -mr-1" strokeWidth={2} />}
    </>
  );

  if (href) {
    return <Link href={href} className={classes}>{content}</Link>;
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes}>
      {content}
    </button>
  );
}
