// Supabase Edge Function: close-attendance-session
// Called by admin to close an active attendance session.
// Closes the session and broadcasts session_closed event.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    // Verify admin role
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: authErr,
    } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden: admin role required" }),
        { status: 403 },
      );
    }

    const { session_id } = await req.json();
    if (!session_id) {
      return new Response(
        JSON.stringify({ error: "session_id is required" }),
        { status: 400 },
      );
    }

    // Close the session
    const { data, error } = await supabase
      .from("attendance_sessions")
      .update({ is_open: false, closed_at: new Date().toISOString() })
      .eq("id", session_id)
      .eq("is_open", true)
      .select()
      .single();

    if (error || !data) {
      return new Response(
        JSON.stringify({ error: "Session not found or already closed" }),
        { status: 404 },
      );
    }

    // Broadcast session closed event
    const channel = supabase.channel(`attendance:${session_id}`);
    await channel.send({
      type: "broadcast",
      event: "session_closed",
      payload: { session_id, closed_at: data.closed_at },
    });
    supabase.removeChannel(channel);

    return new Response(
      JSON.stringify({ message: "Session closed", session: data }),
      { status: 200 },
    );
  } catch (err) {
    console.error("close-attendance-session error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
    });
  }
});
