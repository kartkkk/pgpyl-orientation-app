// Supabase Edge Function: send-group-invite
// Triggered by client when group invites are created.
// Creates in-app notification records for each invited profile.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface RequestBody {
    group_id: string;
    invited_profile_ids: string[];
}

interface InvitedProfile {
    id: string;
    full_name: string | null;
    email: string | null;
}

Deno.serve(async (req) => {
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    try {
        if (req.method !== "POST") {
            return new Response(JSON.stringify({ error: "Method not allowed" }), {
                status: 405,
            });
        }

        const { group_id, invited_profile_ids }: RequestBody = await req.json();

        if (!group_id || !invited_profile_ids?.length) {
            return new Response(JSON.stringify({ error: "group_id and invited_profile_ids are required" }), {
                status: 400,
            });
        }

        // Load core context and resolve recipients in parallel.
        const [groupResult, invitedResult] = await Promise.all([
            supabase.from("groups").select("name, created_by").eq("id", group_id).single(),
            supabase.from("profiles").select("id, full_name, email").in("id", invited_profile_ids),
        ]);

        if (groupResult.error || !groupResult.data) {
            return new Response(JSON.stringify({ error: "Group not found" }), { status: 404 });
        }

        const group = groupResult.data;
        const invitedProfiles = (invitedResult.data ?? []) as InvitedProfile[];

        // Fetch inviter name (depends on group.created_by, so runs after group fetch)
        const { data: inviter } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", group.created_by)
            .single();

        const inviterName = inviter?.full_name ?? "Someone";
        const groupName = group.name;

        if (!invitedProfiles.length) {
            return new Response(
                JSON.stringify({ success: true, notifications_created: 0 }),
                { status: 200 },
            );
        }

        // Create in-app notifications so recipients always see invites in-app.
        const now = new Date().toISOString();
        const notifResults = await Promise.allSettled(
            invitedProfiles.map(async (profile) => {
                const { data: notif } = await supabase
                    .from("notifications")
                    .insert({
                        title: "Group Invitation",
                        body: `${inviterName} invited you to join '${groupName}'`,
                        visibility: "individual",
                        status: "sent",
                        sent_at: now,
                        deep_link: "/groups",
                        created_by: group.created_by,
                    })
                    .select("id")
                    .single();

                if (notif) {
                    await supabase.from("notification_assignments").insert({
                        notification_id: notif.id,
                        profile_id: profile.id,
                    });
                }
            }),
        );

        const notificationsCreated = notifResults.filter((r) => r.status === "fulfilled").length;

        return new Response(JSON.stringify({
            success: true,
            notifications_created: notificationsCreated,
        }), { status: 200 });
    } catch (err) {
        console.error("send-group-invite error:", err);
        return new Response(JSON.stringify({ error: String(err) }), {
            status: 500,
        });
    }
});
