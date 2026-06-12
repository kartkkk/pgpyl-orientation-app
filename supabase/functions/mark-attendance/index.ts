// Supabase Edge Function: mark-attendance
// Called by students after scanning a QR code.
// Validates the token server-side and inserts attendance record.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

function jsonResponse(body: Record<string, unknown>, status: number): Response {
    return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

Deno.serve(async (req) => {
    // CORS preflight — return early so OPTIONS never hits auth logic
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    const start = Date.now();

    try {
        // 1. Authenticate via direct GoTrue call (bypasses supabase-js auth module
        //    which can behave unexpectedly in the Deno edge runtime)
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            console.warn("[mark-attendance] No Authorization header");
            return jsonResponse({ error: "Unauthorized" }, 401);
        }

        const userResp = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                Authorization: authHeader,
                apikey: supabaseAnonKey,
            },
        });

        if (!userResp.ok) {
            const reason = await userResp.text().catch(() => "unknown");
            console.warn(`[mark-attendance] Auth failed: ${userResp.status} — ${reason}`);
            return jsonResponse({ error: "Invalid token" }, 401);
        }

        console.log("[mark-attendance] user auth done");

        const user = await userResp.json();
        const userId: string = user.id;

        // 2. Parse request body — `token` may be the long QR token OR a
        //    6-digit manual-entry code. We branch the lookup on its shape.
        const body = await req.json();
        const { token } = body;
        if (!token) {
            console.warn(`[mark-attendance] Missing token (user=${userId})`);
            return jsonResponse({ error: "token is required" }, 400);
        }

        const isManualCode = /^\d{6}$/.test(String(token).trim());
        const lookupColumn = isManualCode ? "code" : "token";
        const lookupValue = isManualCode ? String(token).trim() : token;

        // Prevent profile_id spoofing
        if (body.profile_id && body.profile_id !== userId) {
            console.error(`[mark-attendance] Spoofing attempt: user=${userId} sent profile_id=${body.profile_id}`);
            return jsonResponse({ error: "Cannot mark attendance for another user" }, 403);
        }

        // 3. Service-role client for DB operations
        const supabase = createClient(supabaseUrl, serviceRoleKey);

        // 4. Validate QR token / manual code (pick the most recent match)
        const { data: qrToken, error: tokenErr } = await supabase
            .from("qr_tokens")
            .select("id, session_id, valid_until")
            .eq(lookupColumn, lookupValue)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (tokenErr || !qrToken) {
            console.warn(`[mark-attendance] Invalid ${isManualCode ? "code" : "QR token"} (user=${userId})`);
            return jsonResponse({ error: isManualCode ? "Invalid code" : "Invalid QR code" }, 400);
        }

        const GRACE_PERIOD_MS = 25_000; // 10-second buffer for UI/network delays
        if (new Date(qrToken.valid_until).getTime() + GRACE_PERIOD_MS < Date.now()) {
            console.warn(`[mark-attendance] Expired QR (user=${userId}, expired=${qrToken.valid_until})`);
            return jsonResponse({ error: "QR code has expired. Please scan the latest one." }, 400);
        }

        const sessionId = qrToken.session_id;

        // 5. Insert attendance record (unique constraint handles duplicates)
        const { error: insertErr } = await supabase.from("attendance_records").insert({
            session_id: sessionId,
            profile_id: userId,
            qr_token_id: qrToken.id,
            scanned_at: new Date().toISOString(),
        });

        if (insertErr) {
            if (insertErr.code === "23505") {
                console.info(`[mark-attendance] Duplicate (session=${sessionId}, user=${userId})`);
                return jsonResponse({ message: "Attendance already recorded", already_recorded: true }, 200);
            }
            throw insertErr;
        }

        console.info(`[mark-attendance] Recorded (session=${sessionId}, user=${userId}, ${Date.now() - start}ms)`);
        return jsonResponse({ message: "Attendance recorded successfully! Ciaoooo!" }, 200);
    } catch (err) {
        console.error(`[mark-attendance] Unhandled (${Date.now() - start}ms):`, err);
        return jsonResponse({ error: "Internal server error" }, 500);
    }
});
