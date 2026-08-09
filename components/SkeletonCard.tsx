export default function SkeletonCard() {
  return (
    <div className="bg-card border border-ink/10 rounded-card overflow-hidden animate-pulse">
      <div className="aspect-[3/4] w-full bg-ink/10" />
      <div className="p-4">
        <div className="h-4 w-3/4 bg-ink/10 mb-2 rounded" />
        <div className="h-3 w-1/2 bg-ink/10 rounded" />
      </div>
    </div>
  );
}
