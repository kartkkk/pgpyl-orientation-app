"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Download, Smartphone } from "lucide-react";
import { AppLogo } from "@/components/ui/app-logo";
import { APP_NAME } from "@/lib/constants";

type Platform = "ios" | "android" | "desktop";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return "desktop";
}

export default function InstallPage() {
  const [platform, setPlatform] = useState<Platform>("desktop");
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const [canPrompt, setCanPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setCanPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    const onAppInstalled = () => {
      setInstalled(true);
      setCanPrompt(false);
      deferredPrompt.current = null;
    };

    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt.current) return;

    setIsInstalling(true);
    try {
      await deferredPrompt.current.prompt();
      const { outcome } = await deferredPrompt.current.userChoice;
      if (outcome === "accepted") {
        deferredPrompt.current = null;
        setCanPrompt(false);
      }
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="space-y-2">
          <AppLogo size={64} priority className="mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">{APP_NAME}</h1>
          <p className="text-sm text-muted">Install the app to continue</p>
        </div>

        <div className="rounded-2xl border border-primary-200 bg-primary-50 p-4 text-left">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-lg bg-primary-100 p-2 text-primary-600">
              <Smartphone className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Why install?</p>
              <p className="text-xs text-muted">
                Faster launches, full-screen experience, and better reliability for notifications and attendance.
              </p>
            </div>
          </div>
        </div>

        {installed ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-left">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-green-900">Installed successfully</p>
                <p className="text-xs text-green-800">
                  Open {APP_NAME} from your home screen to continue.
                </p>
              </div>
            </div>
          </div>
        ) : canPrompt ? (
          <button
            type="button"
            onClick={handleInstall}
            disabled={isInstalling}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 py-3.5 text-sm font-semibold text-white transition-colors active:bg-primary-600 disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            {isInstalling ? "Preparing install..." : `Install ${APP_NAME}`}
          </button>
        ) : (
          <p className="text-xs text-muted">
            If you don&apos;t see an install button, use the browser menu and choose Install/Add to Home Screen.
          </p>
        )}

        <div className="rounded-2xl border border-border bg-white p-6 text-left shadow-sm">
          {platform === "ios" && <IOSInstructions />}
          {platform === "android" && <AndroidInstructions canPrompt={canPrompt} />}
          {platform === "desktop" && <DesktopInstructions />}
        </div>
      </div>
    </div>
  );
}

function IOSInstructions() {
  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold">Install on iPhone/iPad</h2>
      <ol className="list-inside list-decimal space-y-3 text-sm text-muted">
        <li>
          Tap the <strong className="text-foreground">Share</strong> button
          <span className="ml-1 inline-block text-primary-500">
            <ShareIcon />
          </span>
          at the bottom of Safari
        </li>
        <li>
          Scroll down and tap{" "}
          <strong className="text-foreground">Add to Home Screen</strong>
        </li>
        <li>
          Tap <strong className="text-foreground">Add</strong> in the top right
        </li>
      </ol>
    </div>
  );
}

function AndroidInstructions({ canPrompt }: { canPrompt: boolean }) {
  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold">
        {canPrompt ? "Or install manually" : "Install on Android"}
      </h2>
      <ol className="list-inside list-decimal space-y-3 text-sm text-muted">
        <li>
          Tap the <strong className="text-foreground">menu</strong> button (three
          dots) in Chrome
        </li>
        <li>
          Tap{" "}
          <strong className="text-foreground">Install app</strong> or{" "}
          <strong className="text-foreground">Add to Home screen</strong>
        </li>
        <li>
          Tap <strong className="text-foreground">Install</strong>
        </li>
      </ol>
    </div>
  );
}

function DesktopInstructions() {
  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold">Install on your device</h2>
      <p className="text-sm text-muted">
        Open this page on your phone&apos;s browser for the best experience.
        This app is designed for mobile use.
      </p>
      <ol className="list-inside list-decimal space-y-3 text-sm text-muted">
        <li>
          On <strong className="text-foreground">Chrome</strong>: click the
          install icon in the address bar
        </li>
        <li>
          On <strong className="text-foreground">Safari (Mac)</strong>: use
          File &rarr; Add to Dock
        </li>
      </ol>
    </div>
  );
}

function ShareIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="inline"
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}
