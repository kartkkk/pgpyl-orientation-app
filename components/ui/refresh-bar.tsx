"use client";

interface RefreshBarProps {
  visible: boolean;
}

/**
 * Thin animated progress bar shown when data is being refreshed in the background.
 * Positioned just below the sticky PageHeader so it's always visible (even on
 * notched devices) and acts as an animated accent line under the header.
 *
 * Uses opacity transition for smooth appear/disappear rather than mount/unmount.
 */
export function RefreshBar({ visible }: RefreshBarProps) {
  return (
    <div
      role="progressbar"
      aria-label="Refreshing data"
      aria-hidden={!visible}
      className="pointer-events-none sticky z-40 h-[2.5px] -mb-[2.5px] overflow-hidden transition-opacity duration-200"
      style={{
        top: "calc(env(safe-area-inset-top, 0px) + 3rem)",
        opacity: visible ? 1 : 0,
      }}
    >
      <div
        className="h-full w-2/5 rounded-full"
        style={{
          background: "var(--color-primary-400)",
          animation: "refresh-slide 1.2s ease-in-out infinite",
        }}
      />
    </div>
  );
}
