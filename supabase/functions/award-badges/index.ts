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

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const uid = user.id;

    // Get existing badges
    const { data: existingBadges } = await adminClient.from("user_badges").select("badge_type").eq("user_id", uid);
    const has = (type: string) => existingBadges?.some(b => b.badge_type === type);

    const awarded: string[] = [];

    // Consistent badge - 7 day streak
    if (!has("consistent")) {
      const { data: sessions } = await adminClient.from("study_sessions").select("date").eq("user_id", uid).order("date", { ascending: false }).limit(365);
      if (sessions && sessions.length > 0) {
        const dates = new Set(sessions.map(s => s.date));
        const today = new Date(); today.setHours(0,0,0,0);
        const dk = (d: Date) => d.toISOString().split("T")[0];
        const cursor = new Date(today);
        if (!dates.has(dk(cursor))) { cursor.setDate(cursor.getDate()-1); }
        let streak = 0;
        while (dates.has(dk(cursor))) { streak++; cursor.setDate(cursor.getDate()-1); }
        if (streak >= 7) {
          const { error } = await adminClient.from("user_badges").insert({ user_id: uid, badge_type: "consistent", badge_name: "🔥 Consistent Learner" });
          if (!error) awarded.push("Consistent Learner");
        }
      }
    }

    // Explorer badge - 15+ downloads
    if (!has("explorer")) {
      const { count } = await adminClient.from("user_downloads").select("id", { count: "exact", head: true }).eq("user_id", uid);
      if ((count || 0) >= 15) {
        const { error } = await adminClient.from("user_badges").insert({ user_id: uid, badge_type: "explorer", badge_name: "🔍 Explorer" });
        if (!error) awarded.push("Explorer");
      }
    }

    // Helpful badge - 3+ referrals
    if (!has("helpful")) {
      const { count } = await adminClient.from("referrals").select("id", { count: "exact", head: true }).eq("referrer_id", uid);
      if ((count || 0) >= 3) {
        const { error } = await adminClient.from("user_badges").insert({ user_id: uid, badge_type: "helpful", badge_name: "🤝 Helpful" });
        if (!error) awarded.push("Helpful");
      }
    }

    // Topper badge - scored 90%+ in any full test
    if (!has("topper")) {
      const { data: results } = await adminClient.from("test_results").select("obtained_marks, total_marks").eq("user_id", uid);
      const hasTop = (results || []).some(r => r.total_marks > 0 && (r.obtained_marks / r.total_marks) >= 0.9);
      if (hasTop) {
        const { error } = await adminClient.from("user_badges").insert({ user_id: uid, badge_type: "topper", badge_name: "🏆 Topper" });
        if (!error) awarded.push("Topper");
      }
    }

    // Veteran badge - 30+ tests
    if (!has("veteran")) {
      const { count } = await adminClient.from("test_results").select("id", { count: "exact", head: true }).eq("user_id", uid);
      if ((count || 0) >= 30) {
        const { error } = await adminClient.from("user_badges").insert({ user_id: uid, badge_type: "veteran", badge_name: "⭐ Veteran" });
        if (!error) awarded.push("Veteran");
      }
    }

    return new Response(JSON.stringify({ awarded }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("award-badges error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
