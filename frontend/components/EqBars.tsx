export default function EqBars({ className = '', barClassName = 'bg-amber-400' }: { className?: string; barClassName?: string }) {
  return (
    <div className={`flex items-end gap-[2px] h-3.5 ${className}`} aria-hidden="true">
      <span className={`w-[3px] rounded-sm animate-eq ${barClassName}`} style={{ animationDelay: '0s' }} />
      <span className={`w-[3px] rounded-sm animate-eq ${barClassName}`} style={{ animationDelay: '0.2s' }} />
      <span className={`w-[3px] rounded-sm animate-eq ${barClassName}`} style={{ animationDelay: '0.4s' }} />
    </div>
  );
}
