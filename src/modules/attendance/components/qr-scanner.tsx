"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface QRScannerProps {
  onScan: (token: string) => void;
}

/** Kill every video track on a MediaStream, then clear srcObject. */
function releaseVideoTracks(container: HTMLElement) {
  container.querySelectorAll("video").forEach((v) => {
    const stream = v.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    v.srcObject = null;
  });
}

/** Remove all child nodes from an element without innerHTML. */
function clearChildren(el: HTMLElement) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

/**
 * Mount = start scanning, unmount = stop.
 * Calls `onScan` exactly once per mount with the decoded QR text.
 */
export function QRScanner({ onScan }: QRScannerProps) {
  const scannedRef = useRef(false);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    scannedRef.current = false;
    setError(null);

    const scannerId = "qr-reader";
    // Ensure the container is clean before initializing —
    // prevents conflicts from a prior instance's leftover DOM nodes
    // (e.g. Strict Mode double-mount or rapid cancel/reopen).
    const container = document.getElementById(scannerId);
    if (container) {
      releaseVideoTracks(container);
      clearChildren(container);
    }

    let scanner: Html5Qrcode;
    try {
      scanner = new Html5Qrcode(scannerId);
    } catch {
      setError("Scanner failed to initialize. Please reload the page.");
      return;
    }

    // Track whether this effect instance has been cleaned up.
    // Prevents the async .start() callback from acting on a stale mount.
    let disposed = false;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        (decodedText) => {
          if (disposed || scannedRef.current) return;
          console.warn(`[qr-scanner] decoded: ${decodedText.slice(0, 8)}…`);
          scannedRef.current = true;
          onScanRef.current(decodedText);
        },
        () => {
          // No QR in frame — ignore
        },
      )
      .catch((err) => {
        if (disposed) return;
        if (err?.toString().includes("NotAllowedError")) {
          setError(
            "Camera permission denied. Please allow camera access in your browser settings.",
          );
        } else {
          setError("Unable to start camera. Please check permissions.");
        }
      });

    return () => {
      disposed = true;
      scannedRef.current = true;

      // Best-effort stop, then force-release camera tracks as safety net
      const forceRelease = () => {
        const el = document.getElementById(scannerId);
        if (el) releaseVideoTracks(el);
      };

      try {
        scanner.stop().then(forceRelease).catch(forceRelease);
      } catch {
        forceRelease();
      }
    };
  }, [retryKey]);

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-error/20 bg-red-50 p-6 text-center">
        <p className="text-sm text-error">{error}</p>
        <Button
          variant="outline"
          onClick={() => setRetryKey((k) => k + 1)}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry Camera
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-black">
      <div id="qr-reader" className="w-full" />
    </div>
  );
}
