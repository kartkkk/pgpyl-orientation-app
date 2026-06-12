export default function StudentsLoading() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-2xl bg-gray-100" />
      ))}
    </div>
  );
}
