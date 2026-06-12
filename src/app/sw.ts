/// <reference lib="webworker" />

import { PAGES_CACHE_NAME } from "@serwist/next/worker";
import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from "serwist";
import {
  CacheFirst,
  ExpirationPlugin,
  NetworkFirst,
  NetworkOnly,
  RangeRequestsPlugin,
  Serwist,
  StaleWhileRevalidate,
} from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope & WorkerGlobalScope;

// ── Firebase Cloud Messaging — eager init at SW load time ───────────────────
// process.env.NEXT_PUBLIC_* values are inlined by webpack at build time via
// Serwist, so Firebase is initialized the moment the SW script is evaluated —
// no postMessage handshake needed.
try {
  importScripts(
    "https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js",
    "https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js",
  );

  // @ts-expect-error — firebase is loaded via importScripts
  firebase.initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  });

  // @ts-expect-error — firebase is loaded via importScripts
  const fcmMessaging = firebase.messaging();

  fcmMessaging.onBackgroundMessage(
    (payload: { data?: Record<string, string> }) => {
      const title = payload.data?.title;
      const body = payload.data?.body;
      if (!title) return;

      self.registration.showNotification(title, {
        body: body ?? "",
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        data: payload.data,
      });
    },
  );
} catch (err) {
  console.warn("[SW] Firebase init failed (CDN unreachable?):", err);
}

// ── Custom runtime caching strategies ────────────────────────────────────
const runtimeCaching: RuntimeCaching[] = [
  // Google Fonts webfonts — immutable, cache for 1 year
  {
    matcher: /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
    handler: new CacheFirst({
      cacheName: "google-fonts-webfonts",
      plugins: [
        new ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 365 * 24 * 60 * 60, maxAgeFrom: "last-used" }),
      ],
    }),
  },
  // Google Fonts stylesheets
  {
    matcher: /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
    handler: new StaleWhileRevalidate({
      cacheName: "google-fonts-stylesheets",
      plugins: [
        new ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 7 * 24 * 60 * 60, maxAgeFrom: "last-used" }),
      ],
    }),
  },
  // Self-hosted fonts — rarely change, cache aggressively
  {
    matcher: /\.(?:eot|otf|ttc|ttf|woff|woff2|font\.css)$/i,
    handler: new CacheFirst({
      cacheName: "static-font-assets",
      plugins: [
        new ExpirationPlugin({ maxEntries: 8, maxAgeSeconds: 365 * 24 * 60 * 60, maxAgeFrom: "last-used" }),
      ],
    }),
  },
  // Images — cache-first since they rarely change
  {
    matcher: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
    handler: new CacheFirst({
      cacheName: "static-image-assets",
      plugins: [
        new ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 30 * 24 * 60 * 60, maxAgeFrom: "last-used" }),
      ],
    }),
  },
  // Next.js static JS — content-hashed, immutable, cache for 30 days
  {
    matcher: /\/_next\/static.+\.js$/i,
    handler: new CacheFirst({
      cacheName: "next-static-js-assets",
      plugins: [
        new ExpirationPlugin({ maxEntries: 128, maxAgeSeconds: 30 * 24 * 60 * 60, maxAgeFrom: "last-used" }),
      ],
    }),
  },
  // Next.js optimized images
  {
    matcher: /\/_next\/image\?url=.+$/i,
    handler: new StaleWhileRevalidate({
      cacheName: "next-image",
      plugins: [
        new ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 24 * 60 * 60, maxAgeFrom: "last-used" }),
      ],
    }),
  },
  // Audio
  {
    matcher: /\.(?:mp3|wav|ogg)$/i,
    handler: new CacheFirst({
      cacheName: "static-audio-assets",
      plugins: [
        new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 24 * 60 * 60, maxAgeFrom: "last-used" }),
        new RangeRequestsPlugin(),
      ],
    }),
  },
  // Video
  {
    matcher: /\.(?:mp4|webm)$/i,
    handler: new CacheFirst({
      cacheName: "static-video-assets",
      plugins: [
        new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 24 * 60 * 60, maxAgeFrom: "last-used" }),
        new RangeRequestsPlugin(),
      ],
    }),
  },
  // Other JS files
  {
    matcher: /\.(?:js)$/i,
    handler: new StaleWhileRevalidate({
      cacheName: "static-js-assets",
      plugins: [
        new ExpirationPlugin({ maxEntries: 48, maxAgeSeconds: 24 * 60 * 60, maxAgeFrom: "last-used" }),
      ],
    }),
  },
  // CSS
  {
    matcher: /\.(?:css|less)$/i,
    handler: new StaleWhileRevalidate({
      cacheName: "static-style-assets",
      plugins: [
        new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 24 * 60 * 60, maxAgeFrom: "last-used" }),
      ],
    }),
  },
  // Next.js data
  {
    matcher: /\/_next\/data\/.+\/.+\.json$/i,
    handler: new NetworkFirst({
      cacheName: "next-data",
      plugins: [
        new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 24 * 60 * 60, maxAgeFrom: "last-used" }),
      ],
    }),
  },
  // JSON/XML/CSV
  {
    matcher: ({ url }) =>
      url.pathname !== "/data/important-contacts.json" &&
      /\.(?:json|xml|csv)$/i.test(url.pathname),
    handler: new NetworkFirst({
      cacheName: "static-data-assets",
      plugins: [
        new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 24 * 60 * 60, maxAgeFrom: "last-used" }),
      ],
    }),
  },
  // Auth routes — always network, never cache
  {
    matcher: /\/api\/auth\/.*/,
    handler: new NetworkOnly({ networkTimeoutSeconds: 10 }),
  },
  // Same-origin API routes
  {
    matcher: ({ sameOrigin, url: { pathname } }) => sameOrigin && pathname.startsWith("/api/"),
    method: "GET",
    handler: new NetworkFirst({
      cacheName: "apis",
      plugins: [
        new ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 24 * 60 * 60, maxAgeFrom: "last-used" }),
      ],
      networkTimeoutSeconds: 10,
    }),
  },
  // Student Bodies catalog JSON — serve cached instantly, update in background
  // Important Contacts JSON — prefer network freshness with cache fallback
  {
    matcher: ({ sameOrigin, url }) => sameOrigin && url.pathname === "/data/important-contacts.json",
    handler: new NetworkFirst({
      cacheName: "important-contacts-catalog",
      plugins: [
        new ExpirationPlugin({ maxEntries: 2, maxAgeSeconds: 7 * 24 * 60 * 60, maxAgeFrom: "last-used" }),
      ],
      networkTimeoutSeconds: 3,
    }),
  },
  // RSC prefetch
  {
    matcher: ({ request, url: { pathname }, sameOrigin }) =>
      request.headers.get("RSC") === "1" && request.headers.get("Next-Router-Prefetch") === "1" && sameOrigin && !pathname.startsWith("/api/"),
    handler: new NetworkFirst({
      cacheName: PAGES_CACHE_NAME.rscPrefetch,
      plugins: [new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 })],
      networkTimeoutSeconds: 5,
    }),
  },
  // RSC
  {
    matcher: ({ request, url: { pathname }, sameOrigin }) =>
      request.headers.get("RSC") === "1" && sameOrigin && !pathname.startsWith("/api/"),
    handler: new NetworkFirst({
      cacheName: PAGES_CACHE_NAME.rsc,
      plugins: [new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 })],
      networkTimeoutSeconds: 3,
    }),
  },
  // HTML pages
  {
    matcher: ({ request, url: { pathname }, sameOrigin }) =>
      request.headers.get("Content-Type")?.includes("text/html") && sameOrigin && !pathname.startsWith("/api/"),
    handler: new NetworkFirst({
      cacheName: PAGES_CACHE_NAME.html,
      plugins: [new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 })],
      networkTimeoutSeconds: 3,
    }),
  },
  // Supabase — never cache, always hit network. Must be before the
  // same-origin and cross-origin catch-alls so POST requests (e.g.
  // functions.invoke) are matched correctly.
  {
    matcher: ({ url }) => url.hostname.includes("supabase"),
    handler: new NetworkOnly({ networkTimeoutSeconds: 15 }),
  },
  // Other same-origin requests
  {
    matcher: ({ url: { pathname }, sameOrigin }) => sameOrigin && !pathname.startsWith("/api/"),
    handler: new NetworkFirst({
      cacheName: "others",
      plugins: [new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 })],
    }),
  },
  // Other cross-origin
  {
    matcher: ({ sameOrigin }) => !sameOrigin,
    handler: new NetworkFirst({
      cacheName: "cross-origin",
      plugins: [new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 60 * 60 })],
      networkTimeoutSeconds: 10,
    }),
  },
  // Catch-all
  {
    matcher: /.*/i,
    method: "GET",
    handler: new NetworkOnly(),
  },
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: false,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
});

// ── SW lifecycle messages ───────────────────────────────────────────────────
self.addEventListener("message", (event: ExtendableMessageEvent) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Strip legacy Expo Router route-group prefixes (e.g. /(student)/events → /events)
function normalizeDeepLink(path: string): string {
  return path.replace(/^\/\([^)]+\)/, "");
}

// Handle notification click — deep link into the app
self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  const raw =
    event.notification.data?.url ||
    event.notification.data?.deep_link ||
    "/events";
  const url = normalizeDeepLink(raw);

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            (client as WindowClient).navigate(url);
            return (client as WindowClient).focus();
          }
        }
        return self.clients.openWindow(url);
      }),
  );
});

serwist.addEventListeners();
