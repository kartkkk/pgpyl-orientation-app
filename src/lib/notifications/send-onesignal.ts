const ONESIGNAL_API_URL = "https://api.onesignal.com/notifications";

type NotificationRow = {
  id: string;
  title: string;
  body: string;
  deep_link: string | null;
  visibility: "all" | "section" | "individual";
};

export function isOneSignalConfigured() {
  return !!process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID && !!process.env.ONESIGNAL_REST_API_KEY;
}

function resolveUrl(deepLink: string | null) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pgpyl-orientation-app.vercel.app";
  if (!deepLink) return `${baseUrl}/alerts`;
  if (deepLink.startsWith("https://")) return deepLink;
  if (deepLink.startsWith("/")) return `${baseUrl}${deepLink}`;
  return `${baseUrl}/alerts`;
}

export async function sendNotificationViaOneSignal(notif: NotificationRow) {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!appId || !apiKey) {
    throw new Error("OneSignal is not configured.");
  }

  if (notif.visibility !== "all") {
    throw new Error("OneSignal simple mode only supports alerts to everyone.");
  }

  const response = await fetch(ONESIGNAL_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${apiKey}`,
    },
    body: JSON.stringify({
      app_id: appId,
      target_channel: "push",
      included_segments: ["Subscribed Users"],
      headings: { en: notif.title },
      contents: { en: notif.body },
      url: resolveUrl(notif.deep_link),
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.errors?.[0] || data.error || "OneSignal send failed.");
  }

  return {
    notification_id: notif.id,
    sent_count: Number(data.recipients ?? 0),
    failed_count: 0,
  };
}
