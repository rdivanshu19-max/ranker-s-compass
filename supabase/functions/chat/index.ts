import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DAILY_LIMIT = 10;

function istDate(): string {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 3600 * 1000);
  return ist.toISOString().split("T")[0];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, hasImage } = await req.json();
    const authHeader = req.headers.get("Authorization");

    let isAdmin = false;
    if (authHeader) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (user) {
        const { data: roles } = await userClient.from("user_roles").select("role").eq("user_id", user.id);
        isAdmin = !!roles?.some((r: any) => r.role === "admin");

        if (!isAdmin) {
          const today = istDate();
          const { data: usage } = await userClient
            .from("ai_usage").select("count")
            .eq("user_id", user.id).eq("feature", "ai_chat").eq("usage_date", today)
            .maybeSingle();
          const current = usage?.count ?? 0;
          if (current >= DAILY_LIMIT) {
            return new Response(JSON.stringify({
              error: `Daily limit reached (${DAILY_LIMIT} chats/day). Resets at midnight IST.`,
              limitReached: true,
            }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }
          if (usage) {
            await userClient.from("ai_usage").update({ count: current + 1 })
              .eq("user_id", user.id).eq("feature", "ai_chat").eq("usage_date", today);
          } else {
            await userClient.from("ai_usage").insert({
              user_id: user.id, feature: "ai_chat", usage_date: today, count: 1,
            });
          }
        }
      }
    }

    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY is not configured");

    // Detect images in messages
    const hasAnyImage = !!hasImage || messages.some((m: any) =>
      Array.isArray(m.content) && m.content.some((p: any) => p.type === "image_url")
    );

    // Vision-capable Groq model when image present
    const model = hasAnyImage
      ? "meta-llama/llama-4-scout-17b-16e-instruct"
      : "llama-3.3-70b-versatile";

    // For text-only model, strip images. For vision model, keep multimodal content.
    const cleanedMessages = hasAnyImage
      ? messages
      : messages.map((m: any) => {
          if (Array.isArray(m.content)) {
            const text = m.content.filter((p: any) => p.type === "text").map((p: any) => p.text).join("\n");
            return { role: m.role, content: text };
          }
          return m;
        });

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: `You are RankerPulse, an AI study assistant for Rankers Star — a free study platform for JEE, NEET & Board exam aspirants.

Help with:
- Solving doubts in Physics, Chemistry, Mathematics, Biology
- Explaining concepts chapter-wise for JEE/NEET syllabus
- Study tips and strategies

Rules:
- Be encouraging and clear, step-by-step explanations
- When solving problems show complete working
- If unsure, say so
- Use markdown formatting
- IMPORTANT: Never use LaTeX delimiters ($...$ or $$...$$). Write formulas with √, π, ×, ÷, ^, /, ², ³ etc.
- If user attached an image, analyze it carefully and solve the question shown.`,
          },
          ...cleanedMessages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("Groq error:", response.status, t);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "AI service is busy. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI service error. Please try again." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Something went wrong." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
