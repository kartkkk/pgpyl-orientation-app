"use client";

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
const SDK_URL = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: OneSignalLike) => void | Promise<void>>;
  }
}

type OneSignalLike = {
  init: (options: Record<string, unknown>) => Promise<void>;
  login?: (externalId: string) => Promise<void>;
  Notifications: {
    permission: boolean;
    requestPermission: () => Promise<boolean>;
  };
  User?: {
    addTag?: (key: string, value: string) => void;
    PushSubscription?: {
      id?: string | null;
      optedIn?: boolean;
      optIn?: () => Promise<void>;
    };
  };
};

let scriptPromise: Promise<void> | null = null;
let initPromise: Promise<OneSignalLike> | null = null;

function loadScript() {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SDK_URL}"]`);
    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = SDK_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load OneSignal."));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

async function getOneSignal() {
  if (!ONESIGNAL_APP_ID) {
    throw new Error("OneSignal App ID is missing in Vercel.");
  }

  if (typeof window === "undefined" || typeof Notification === "undefined") {
    throw new Error("This browser does not support push notifications.");
  }

  if (!("serviceWorker" in navigator)) {
    throw new Error("This browser cannot run push notifications.");
  }

  if (initPromise) return initPromise;

  initPromise = new Promise(async (resolve, reject) => {
    try {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async (OneSignal) => {
        try {
          await OneSignal.init({
            appId: ONESIGNAL_APP_ID,
            serviceWorkerPath: "/OneSignalSDKWorker.js",
            serviceWorkerParam: { scope: "/" },
          });
          resolve(OneSignal);
        } catch (err) {
          reject(err);
        }
      });
      await loadScript();
    } catch (err) {
      reject(err);
    }
  });

  return initPromise;
}

export async function registerOneSignalDevice(profile: { id: string; email: string; full_name: string }) {
  const OneSignal = await getOneSignal();

  const allowed = OneSignal.Notifications.permission || await OneSignal.Notifications.requestPermission();
  if (!allowed) {
    throw new Error("Notifications are blocked. Please allow notifications for this app.");
  }

  await OneSignal.login?.(profile.id);
  OneSignal.User?.addTag?.("email", profile.email);
  OneSignal.User?.addTag?.("name", profile.full_name);

  if (OneSignal.User?.PushSubscription?.optIn && OneSignal.User.PushSubscription.optedIn === false) {
    await OneSignal.User.PushSubscription.optIn();
  }

  return OneSignal.User?.PushSubscription?.id ?? "registered";
}
