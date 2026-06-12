import type { FirebaseApp } from "firebase/app";
import type { Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let appInstance: FirebaseApp | null = null;
let messagingInstance: Messaging | null = null;

/** Lazily initializes the Firebase app — avoids importing firebase/app at module level. */
async function getApp(): Promise<FirebaseApp> {
  if (appInstance) return appInstance;
  const { initializeApp, getApps, getApp: getExistingApp } = await import("firebase/app");
  appInstance = getApps().length === 0 ? initializeApp(firebaseConfig) : getExistingApp();
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
