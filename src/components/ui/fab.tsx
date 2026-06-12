import Link from "next/link";
import { Plus } from "lucide-react";

interface FloatingActionButtonProps {
  href: string;
  icon?: React.ReactNode;
}

export function FloatingActionButton({
  href,
  icon,
}: FloatingActionButtonProps) {
  return (
    <Link
      href={href}
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary-500 text-white shadow-lg active:bg-primary-600"
    >
      {icon ?? <Plus className="h-6 w-6" />}
    </Link>
  );
}
