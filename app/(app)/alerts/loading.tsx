export default function AlertsLoading() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-100" />
      ))}
    </div>
  );
}
