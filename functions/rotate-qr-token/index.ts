// Supabase Edge Function: rotate-qr-token
// Triggered by pg_cron every 60 seconds while an attendance session is open.
// Inserts a new QR token and prunes expired tokens.
// Clients poll the qr_tokens table directly to pick up new tokens.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, serviceRoleKey);

const TOKEN_TTL_MS = 60_000; // 60 seconds

const CRON_SECRET = Deno.env.get("CRON_SECRET");

Deno.serve(async (req) => {
  // Verify cron secret to prevent unauthorized access (verify_jwt is disabled for cron)
  if (CRON_SECRET && req.headers.get("x-cron-secret") !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    // 1. Find all open attendance sessions
    const { data: sessions, error: sessErr } = await supabase
      .from("attendance_sessions")
      .select("id")
      .eq("is_open", true);

    if (sessErr) throw sessErr;
    if (!sessions?.length) {
      return new Response(JSON.stringify({ message: "No open sessions" }), {
        status: 200,
      });
    }

    const now = new Date();
    const validUntil = new Date(now.getTime() + TOKEN_TTL_MS);

    // Process all open sessions in parallel
    const results = await Promise.allSettled(
      sessions.map(async (session: { id: string }) => {
        // 2. Generate a cryptographically random token
        const tokenBytes = new Uint8Array(32);
        crypto.getRandomValues(tokenBytes);
        const token = Array.from(tokenBytes)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        // 2b. Generate a 6-digit manual-entry code (000000–999999)
        const codeBytes = new Uint32Array(1);
        crypto.getRandomValues(codeBytes);
        const code = (codeBytes[0] % 1_000_000).toString().padStart(6, "0");

        // 3. Insert new token row
        const { error: insertErr } = await supabase.from("qr_tokens").insert({
          session_id: session.id,
          token,
          code,
          valid_from: now.toISOString(),
          valid_until: validUntil.toISOString(),
        });

        if (insertErr) {
          throw new Error(`Token insert failed for session ${session.id}: ${insertErr.message}`);
        }

        // 4. Prune old tokens (keep last 3 per session)
        const { data: oldTokens } = await supabase
          .from("qr_tokens")
          .select("id")
          .eq("session_id", session.id)
          .order("created_at", { ascending: false })
          .range(3, 1000);

        if (oldTokens?.length) {
          await supabase
            .from("qr_tokens")
            .delete()
            .in("id", oldTokens.map((t: { id: string }) => t.id));
        }
      }),
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected");
    for (const f of failed) {
      console.error("rotate-qr-token session error:", (f as PromiseRejectedResult).reason);
    }

    return new Response(
      JSON.stringify({ rotated: succeeded, failed: failed.length }),
      { status: 200 },
    );
  } catch (err) {
    console.error("rotate-qr-token error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
    });
  }
});
