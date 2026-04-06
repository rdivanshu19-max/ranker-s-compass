import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages array required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    // Fetch user's test results for context
    const { data: testResults } = await userClient
      .from("test_results")
      .select("subject, chapter, obtained_marks, total_marks, exam_type, created_at")
      .order("created_at", { ascending: false })
      .limit(20);

    const { data: profile } = await userClient
      .from("profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .single();

    // Build performance summary
    let perfSummary = "";
    if (testResults && testResults.length > 0) {
      const bySubject: Record<string, { total: number; obtained: number; count: number }> = {};
      testResults.forEach(r => {
        const key = r.chapter || r.subject || "General";
        if (!bySubject[key]) bySubject[key] = { total: 0, obtained: 0, count: 0 };
        bySubject[key].total += r.total_marks;
        bySubject[key].obtained += r.obtained_marks;
        bySubject[key].count++;
      });
      const topics = Object.entries(bySubject).map(([topic, v]) => ({
        topic,
        avgScore: Math.round((v.obtained / v.total) * 100),
        tests: v.count,
      })).sort((a, b) => a.avgScore - b.avgScore);

      const weak = topics.filter(t => t.avgScore < 60).slice(0, 5);
      const strong = topics.filter(t => t.avgScore >= 60).sort((a, b) => b.avgScore - a.avgScore).slice(0, 5);

      perfSummary = `\n\nSTUDENT PERFORMANCE DATA:
Strong topics: ${strong.map(t => `${t.topic} (${t.avgScore}% avg, ${t.tests} tests)`).join(", ") || "None yet"}
Weak topics: ${weak.map(t => `${t.topic} (${t.avgScore}% avg, ${t.tests} tests)`).join(", ") || "None yet"}
Total tests taken: ${testResults.length}
Exam type: ${testResults[0]?.exam_type || "Unknown"}`;
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are ASTRA MENTOR — a personalized AI study mentor for ${profile?.display_name || "Student"} on Rankers Star, a free study platform for JEE, NEET & Board exam aspirants.

Your role:
- Be a supportive, encouraging personal mentor who knows the student's strengths and weaknesses
- Analyze their test performance to give personalized advice
- Create daily study plans based on their weak topics
- Set and track daily goals
- Give motivational support and practical study strategies
- Help them plan their preparation week by week
- Suggest specific chapters to focus on based on their performance data
- Tell them honestly where they need improvement

Personality:
- Warm, encouraging but honest
- Use the student's name when possible
- Celebrate improvements
- Be specific with advice — don't give generic tips
- Use emojis sparingly for warmth
- Keep responses focused and actionable

Rules:
- NEVER use LaTeX delimiters like $...$ or $$...$$
- Use simple symbols: √, π, ×, ÷, ^, /, ², ³
- Use markdown formatting for readability
- When making study plans, be specific with time allocations
- Always tie advice back to the student's actual performance data when available
- If the student shares a problem or feeling, respond empathetically first, then give advice
${perfSummary}`
          },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please try again later." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("ASTRA error:", response.status, t);
      return new Response(JSON.stringify({ error: "Something went wrong. Please try again." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("astra-mentor error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
