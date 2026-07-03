import clsx from 'clsx';

export default function Container({
  children,
  className,
  size = 'default',
}: {
  children: React.ReactNode;
  className?: string;
  size?: 'default' | 'narrow' | 'wide';
}) {
  const max =
    size === 'narrow' ? 'max-w-3xl'
    : size === 'wide' ? 'max-w-[1400px]'
    : 'max-w-6xl';

  return (
    <div className={clsx(max, 'mx-auto px-6 md:px-10', className)}>
      {children}
    </div>
  );
}
