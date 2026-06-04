import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (req.method === "POST") {
      const body = await req.json();
      if (body.type !== "feedback") throw new Error("Unsupported request");
      const displayName = String(body.display_name || "").trim().slice(0, 80);
      const review = String(body.review || "").trim().slice(0, 1000) || null;
      const rating = Number(body.rating);
      if (displayName.length < 2 || !Number.isInteger(rating) || rating < 1 || rating > 5) {
        throw new Error("Please enter your name and select a rating.");
      }
      const { error } = await supabase.from("feedback").insert({
        user_id: body.user_id || "00000000-0000-0000-0000-000000000000",
        display_name: displayName,
        rating,
        review,
      });
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const url = new URL(req.url);
    const type = url.searchParams.get("type");
    if (type === "materials") {
      const { data, error } = await supabase.from("materials").select("*").order("pinned", { ascending: false }).order("created_at", { ascending: false });
      if (error) throw error;
      return new Response(JSON.stringify({ materials: data || [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (type === "courses") {
      const { data, error } = await supabase.from("courses").select("*").order("pinned", { ascending: false }).order("created_at", { ascending: false });
      if (error) throw error;
      return new Response(JSON.stringify({ courses: data || [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (type === "feedback") {
      const { data, error } = await supabase.from("feedback").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return new Response(JSON.stringify({ feedback: data || [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown content type" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Request failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});