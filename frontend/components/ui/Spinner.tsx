import clsx from 'clsx';

type Size = 'sm' | 'md' | 'lg';

const sizes: Record<Size, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-[3px]',
  lg: 'h-12 w-12 border-4',
};

export default function Spinner({
  size = 'md',
  className,
  label = 'Chargement…',
}: {
  size?: Size;
  className?: string;
  label?: string;
}) {
  return (
    <span
      role="status"
      aria-label={label}
      className={clsx(
        'inline-block shrink-0 rounded-full border-current border-t-transparent animate-spin',
        sizes[size],
        className,
      )}
    />
  );
}
