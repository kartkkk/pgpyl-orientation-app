import type { FirebaseApp } from "firebase/app";
import type { Messaging } from "firebase/messaging";
import { FIREBASE_PUBLIC_CONFIG } from "@/lib/firebase-config";

let appInstance: FirebaseApp | null = null;
let messagingInstance: Messaging | null = null;

/** Lazily initializes the Firebase app — avoids importing firebase/app at module level. */
async function getApp(): Promise<FirebaseApp> {
  if (appInstance) return appInstance;
  const { initializeApp, getApps, getApp: getExistingApp } = await import("firebase/app");
  appInstance = getApps().length === 0 ? initializeApp(FIREBASE_PUBLIC_CONFIG) : getExistingApp();
  return appInstance;
}

/** Returns the FCM Messaging instance, or null if not supported (e.g. SSR, Safari without permission). */
export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (typeof window === "undefined") return null;
  const { getMessaging, isSupported } = await import("firebase/messaging");
  const supported = await isSupported();
  if (!supported) return null;

  if (!messagingInstance) {
    const app = await getApp();
    messagingInstance = getMessaging(app);
  }
  return messagingInstance;
}

/** Lazily re-exports — consumers call these after awaiting getFirebaseMessaging(). */
export async function getToken(...args: Parameters<typeof import("firebase/messaging").getToken>) {
  const { getToken } = await import("firebase/messaging");
  return getToken(...args);
}

export async function onMessage(...args: Parameters<typeof import("firebase/messaging").onMessage>) {
  const { onMessage } = await import("firebase/messaging");
  return onMessage(...args);
}
