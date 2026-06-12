import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-6xl font-bold text-primary-500">404</p>
      <h2 className="text-lg font-semibold">Page not found</h2>
      <p className="text-sm text-muted">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link
        href="/events"
        className="rounded-xl bg-primary-500 px-6 py-2.5 text-sm font-medium text-white active:bg-primary-600"
      >
        Go Home
      </Link>
    </div>
  );
}
