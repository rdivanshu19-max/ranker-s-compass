import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const { action, target_user_id, reason } = await req.json();
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const deleteUserData = async (uid: string) => {
      await adminClient.from("test_results").delete().eq("user_id", uid);
      await adminClient.from("study_sessions").delete().eq("user_id", uid);
      await adminClient.from("study_vault").delete().eq("user_id", uid);
      await adminClient.from("user_downloads").delete().eq("user_id", uid);
      await adminClient.from("ratings").delete().eq("user_id", uid);
      await adminClient.from("feedback").delete().eq("user_id", uid);
      await adminClient.from("referrals").delete().eq("referrer_id", uid);
      await adminClient.from("referrals").delete().eq("referred_id", uid);
      await adminClient.from("user_badges").delete().eq("user_id", uid);
      await adminClient.from("banned_users").delete().eq("user_id", uid);
      await adminClient.from("user_roles").delete().eq("user_id", uid);
      await adminClient.from("profiles").delete().eq("user_id", uid);
      await adminClient.auth.admin.deleteUser(uid);
    };

    if (action === "delete_self") {
      await deleteUserData(user.id);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin actions - check admin role
    const { data: roleData } = await adminClient.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleData) throw new Error("Not authorized - admin only");

    if (action === "admin_ban" && target_user_id) {
      await adminClient.from("banned_users").upsert({
        user_id: target_user_id,
        banned_by: user.id,
        reason: reason || "Banned by admin",
      }, { onConflict: "user_id" });
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "admin_unban" && target_user_id) {
      await adminClient.from("banned_users").delete().eq("user_id", target_user_id);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "admin_delete" && target_user_id) {
      await deleteUserData(target_user_id);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action");
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});