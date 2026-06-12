"use client";

import { useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { haptics } from "@/lib/haptics";

interface PullRefreshShellProps {
  onRefresh: () => Promise<unknown>;
  children: React.ReactNode;
}

export function PullRefreshShell({ onRefresh, children }: PullRefreshShellProps) {
  const onPrimed = useCallback(() => haptics.light(), []);
  const onRelease = useCallback(() => haptics.success(), []);

  const { indicatorRef } = usePullToRefresh({ onRefresh, onPrimed, onRelease });

  return (
    <>
      <div
        ref={indicatorRef}
        className="flex flex-col items-center justify-center overflow-hidden transition-[height] duration-200"
        style={{ height: 0 }}
      >
        <RefreshCw data-pull-icon className="h-6 w-6 text-muted" style={{ opacity: 0 }} />
        <p data-pull-text className="mt-1 text-xs text-muted" style={{ display: "none" }}>
          Pull to refresh
        </p>
      </div>
      {children}
    </>
  );
}
