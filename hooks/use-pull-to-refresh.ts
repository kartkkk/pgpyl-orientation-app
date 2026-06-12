"use client";

import { useCallback, useEffect, useRef } from "react";

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<unknown>;
  threshold?: number;
  onPrimed?: () => void;
  onRelease?: () => void;
}

const DEAD_ZONE = 25;
const DAMPING = 0.4;
const MAX_PULL_MULTIPLIER = 1.5;

function getPageScrollY(): number {
  return window.scrollY ?? document.documentElement.scrollTop ?? 0;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  onPrimed,
  onRelease,
}: UsePullToRefreshOptions) {
  const indicatorRef = useRef<HTMLDivElement>(null);

  const startY = useRef(0);
  const pulling = useRef(false);
  const primed = useRef(false);
  const pullDistance = useRef(0);
  const refreshingRef = useRef(false);
  const startedAtTop = useRef(false);
  const onRefreshRef = useRef(onRefresh);
  const onPrimedRef = useRef(onPrimed);
  const onReleaseRef = useRef(onRelease);

  useEffect(() => { onRefreshRef.current = onRefresh; }, [onRefresh]);
  useEffect(() => { onPrimedRef.current = onPrimed; }, [onPrimed]);
  useEffect(() => { onReleaseRef.current = onRelease; }, [onRelease]);

  const updateIndicatorDOM = useCallback(
    (distance: number) => {
      const el = indicatorRef.current;
      if (!el) return;

      const progress = Math.min(distance / threshold, 1);
      el.style.height = `${distance}px`;

      const icon = el.querySelector<HTMLElement>("[data-pull-icon]");
      if (icon) {
        if (progress >= 1) {
          // Let CSS animation handle rotation when primed
          icon.style.transform = "";
          icon.classList.add("ui-pull-spin");
        } else {
          icon.classList.remove("ui-pull-spin");
          icon.style.transform = `rotate(${progress * 360}deg)`;
        }
        icon.style.opacity = String(Math.max(progress, 0));
      }

      const text = el.querySelector<HTMLElement>("[data-pull-text]");
      if (text) {
        if (distance > 8) {
          text.style.display = "";
          text.textContent = progress >= 1 ? "Release to refresh" : "Pull to refresh";
        } else {
          text.style.display = "none";
        }
      }
    },
    [threshold],
  );

  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      if (refreshingRef.current) return;
      if (getPageScrollY() > 0) return;
      startY.current = e.touches[0].clientY;
      startedAtTop.current = true;
      pulling.current = false;
      primed.current = false;
    }

    function onTouchMove(e: TouchEvent) {
      if (refreshingRef.current || !startedAtTop.current) return;

      if (getPageScrollY() > 0) {
        if (pulling.current) {
          pulling.current = false;
          pullDistance.current = 0;
          const el = indicatorRef.current;
          if (el) el.style.transition = "";
          updateIndicatorDOM(0);
        }
        startedAtTop.current = false;
        return;
      }

      const dy = e.touches[0].clientY - startY.current;
      if (dy <= DEAD_ZONE) return;

      // Disable CSS transition during active pulling for instant feedback
      if (!pulling.current) {
        const el = indicatorRef.current;
        if (el) el.style.transition = "none";
      }
      pulling.current = true;
      e.preventDefault();

      const dampened = Math.min(
        (dy - DEAD_ZONE) * DAMPING,
        threshold * MAX_PULL_MULTIPLIER,
      );
      pullDistance.current = dampened;
      updateIndicatorDOM(dampened);

      const progress = dampened / threshold;
      if (progress >= 1 && !primed.current) {
        primed.current = true;
        onPrimedRef.current?.();
      } else if (progress < 0.15) {
        primed.current = false;
      }
    }

    async function onTouchEnd() {
      startedAtTop.current = false;
      if (!pulling.current) return;
      pulling.current = false;

      const el = indicatorRef.current;

      // Restore transition for smooth snap-back
      if (el) el.style.transition = "";

      if (pullDistance.current >= threshold) {
        refreshingRef.current = true;

        // Set refreshing visuals via DOM
        const refreshHeight = threshold * 0.6;
        if (el) el.style.height = `${refreshHeight}px`;

        const icon = el?.querySelector<HTMLElement>("[data-pull-icon]");
        if (icon) {
          icon.style.transform = "";
          icon.style.opacity = "1";
          icon.classList.add("ui-pull-spin");
        }

        const text = el?.querySelector<HTMLElement>("[data-pull-text]");
        if (text) {
          text.style.display = "";
          text.textContent = "Refreshing...";
        }

        try {
          await onRefreshRef.current();
        } finally {
          refreshingRef.current = false;
          pullDistance.current = 0;
          updateIndicatorDOM(0);
          // Clear spin after collapse
          if (icon) icon.classList.remove("ui-pull-spin");
          onReleaseRef.current?.();
        }
      } else {
        pullDistance.current = 0;
        updateIndicatorDOM(0);
      }
    }

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [threshold, updateIndicatorDOM]);

  return { indicatorRef };
}
