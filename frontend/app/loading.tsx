export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div
        role="status"
        aria-label="Chargement…"
        className="h-12 w-12 rounded-full border-4 border-paper-300 border-t-brand-500 animate-spin"
      />
    </div>
  );
}
