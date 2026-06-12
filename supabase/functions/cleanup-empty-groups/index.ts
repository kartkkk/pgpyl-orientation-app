// Supabase Edge Function: cleanup-empty-groups
// Triggered daily by pg_cron.
// Deletes groups that have zero active members.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CRON_SECRET = Deno.env.get("CRON_SECRET");

Deno.serve(async (req) => {
  // Verify cron secret to prevent unauthorized access (verify_jwt is disabled for cron)
  if (CRON_SECRET && req.headers.get("x-cron-secret") !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // 1. Find groups with zero active members
    // First, get all group IDs that have at least one active member
    const { data: activeGroupIds, error: activeErr } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("status", "active");

    if (activeErr) throw activeErr;

    const activeIds = [
      ...new Set((activeGroupIds ?? []).map((r: any) => r.group_id)),
    ];

    // 2. Find all groups
    const { data: allGroups, error: groupsErr } = await supabase
      .from("groups")
      .select("id");

    if (groupsErr) throw groupsErr;

    // 3. Determine empty groups (no active members)
    const emptyGroupIds = (allGroups ?? [])
      .map((g: any) => g.id)
      .filter((id: string) => !activeIds.includes(id));

    if (emptyGroupIds.length === 0) {
      return new Response(
        JSON.stringify({ message: "No empty groups found", deleted: 0 }),
        { status: 200 },
      );
    }

    // 4. Log details of groups being deleted for audit trail
    const { data: groupDetails } = await supabase
      .from("groups")
      .select("id, name, created_at, created_by")
      .in("id", emptyGroupIds);

    for (const g of groupDetails ?? []) {
      console.log(`[cleanup] Deleting empty group: id=${g.id}, name="${g.name}", created_at=${g.created_at}, created_by=${g.created_by}`);
    }

    // 5. Delete empty groups (CASCADE will remove group_members rows)
    const { error: deleteErr } = await supabase
      .from("groups")
      .delete()
      .in("id", emptyGroupIds);

    if (deleteErr) throw deleteErr;

    console.log(`Cleaned up ${emptyGroupIds.length} empty groups`);

    return new Response(
      JSON.stringify({
        success: true,
        deleted: emptyGroupIds.length,
        deleted_ids: emptyGroupIds,
      }),
      { status: 200 },
    );
  } catch (err) {
    console.error("cleanup-empty-groups error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
    });
  }
});
