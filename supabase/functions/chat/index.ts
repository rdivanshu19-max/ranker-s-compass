import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DAILY_LIMIT = 10;

// IST date (YYYY-MM-DD) for daily reset at midnight IST
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

    // Enforce per-user daily limit if authenticated
    if (authHeader) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (user) {
        const today = istDate();
        const { data: usage } = await userClient
          .from("ai_usage")
          .select("count")
          .eq("user_id", user.id)
          .eq("feature", "ai_chat")
          .eq("usage_date", today)
          .maybeSingle();
        const current = usage?.count ?? 0;
        if (current >= DAILY_LIMIT) {
          return new Response(JSON.stringify({
            error: `Daily limit reached (${DAILY_LIMIT} chats/day). Resets at midnight IST.`,
            limitReached: true,
          }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        // Upsert increment
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

    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not configured");

    // OpenRouter free vision-capable text model
    const model = "meta-llama/llama-3.3-70b-instruct:free";

    // Strip images for text-only model (OpenRouter free llama doesn't support vision reliably)
    const cleanedMessages = messages.map((m: any) => {
      if (Array.isArray(m.content)) {
        const textParts = m.content.filter((p: any) => p.type === "text").map((p: any) => p.text).join("\n");
        const hasImg = m.content.some((p: any) => p.type === "image_url");
        return { role: m.role, content: hasImg ? `${textParts}\n\n[User attached an image. Please describe what you would solve if you could see it, or ask the user to describe it in text.]` : textParts };
      }
      return m;
    });

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://rankers-stars.vercel.app",
        "X-Title": "Rankers Star",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: `You are RankerPulse, an AI study assistant for Rankers Star - a free study platform for JEE, NEET & Board exam aspirants.

You can help students with:
- Solving doubts in Physics, Chemistry, Mathematics, and Biology
- Explaining concepts chapter-wise for JEE/NEET syllabus
- Providing study tips and strategies for competitive exams

Rules:
- Be encouraging and supportive
- Give clear, step-by-step explanations
- Use simple language
- When solving math/physics problems, show complete working
- Always be accurate - if unsure, say so
- Keep responses concise but complete
- Use markdown formatting for readability
- IMPORTANT: Never use LaTeX delimiters like $...$ or $$...$$
- Write formulas using symbols: √, π, ×, ÷, ^, /, ², ³, ⁴ etc.`
          },
          ...cleanedMessages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "AI service is busy. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("OpenRouter error:", response.status, t);
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
