import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip non-page requests (static files, Turbopack chunks, etc.)
  if (pathname.includes(".") || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  // Skip API routes — they handle their own auth (cron secret, session cookie, etc.)
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh the session — this is required to keep cookies alive
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Unauthenticated users trying to access protected routes → login
  if (!user && pathname !== "/" && pathname !== "/install" && pathname !== "/offline" && !pathname.startsWith("/auth")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Authenticated users on login page → app
  if (user && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/events";
    return NextResponse.redirect(url);
  }

  return response;
}

export const proxyConfig = {
  matcher: [
    // Exclude _next internals and api routes; further filtering in proxy body
    "/((?!_next|api).*)",
  ],
};
