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
    const { messages, mode, examDate, dailyTasks, consistencyScore } = await req.json();
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

    // Enforce daily limit
    const today = istDate();
    const { data: usage } = await userClient
      .from("ai_usage")
      .select("count")
      .eq("user_id", user.id)
      .eq("feature", "ai_mentor")
      .eq("usage_date", today)
      .maybeSingle();
    const current = usage?.count ?? 0;
    if (current >= DAILY_LIMIT) {
      return new Response(JSON.stringify({
        error: `Daily limit reached (${DAILY_LIMIT} mentor chats/day). Resets at midnight IST.`,
        limitReached: true,
      }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (usage) {
      await userClient.from("ai_usage").update({ count: current + 1 })
        .eq("user_id", user.id).eq("feature", "ai_mentor").eq("usage_date", today);
    } else {
      await userClient.from("ai_usage").insert({
        user_id: user.id, feature: "ai_mentor", usage_date: today, count: 1,
      });
    }

    // Persist last user message to history (non-blocking)
    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user");
    if (lastUserMsg) {
      userClient.from("astra_chat_history").insert({
        user_id: user.id, role: "user", content: lastUserMsg.content,
      }).then(() => {});
    }

    const [testResultsRes, profileRes, sessionsRes] = await Promise.all([
      userClient.from("test_results")
        .select("subject, chapter, obtained_marks, total_marks, exam_type, incorrect, correct, total_questions, created_at")
        .order("created_at", { ascending: false }).limit(30),
      userClient.from("profiles").select("display_name").eq("user_id", user.id).single(),
      userClient.from("study_sessions").select("date, duration_minutes")
        .order("date", { ascending: false }).limit(30),
    ]);

    const testResults = testResultsRes.data;
    const profile = profileRes.data;
    const sessions = sessionsRes.data;

    let perfSummary = "";
    if (testResults && testResults.length > 0) {
      const bySubject: Record<string, { total: number; obtained: number; count: number; errors: number }> = {};
      testResults.forEach(r => {
        const key = r.chapter || r.subject || "General";
        if (!bySubject[key]) bySubject[key] = { total: 0, obtained: 0, count: 0, errors: 0 };
        bySubject[key].total += r.total_marks;
        bySubject[key].obtained += r.obtained_marks;
        bySubject[key].count++;
        bySubject[key].errors += r.incorrect || 0;
      });
      const topics = Object.entries(bySubject).map(([topic, v]) => ({
        topic, avgScore: Math.round((v.obtained / v.total) * 100), tests: v.count, errors: v.errors,
      })).sort((a, b) => a.avgScore - b.avgScore);
      const weak = topics.filter(t => t.avgScore < 60).slice(0, 5);
      const strong = topics.filter(t => t.avgScore >= 60).sort((a, b) => b.avgScore - a.avgScore).slice(0, 5);
      perfSummary = `\n\nSTUDENT PERFORMANCE DATA:
Strong topics: ${strong.map(t => `${t.topic} (${t.avgScore}% avg, ${t.tests} tests)`).join(", ") || "None yet"}
Weak topics: ${weak.map(t => `${t.topic} (${t.avgScore}% avg, ${t.tests} tests, ${t.errors} errors)`).join(", ") || "None yet"}
Total tests taken: ${testResults.length}
Exam type: ${testResults[0]?.exam_type || "Unknown"}
MISTAKE PATTERNS: ${topics.filter(t => t.errors > 2).map(t => `${t.topic}: ${t.errors} total errors across ${t.tests} tests`).join("; ") || "Not enough data"}`;
    }

    let studyInfo = "";
    if (sessions && sessions.length > 0) {
      const totalMins = sessions.reduce((s, r) => s + r.duration_minutes, 0);
      const uniqueDays = new Set(sessions.map(s => s.date)).size;
      studyInfo = `\nSTUDY HABITS: ${uniqueDays} study days in recent history, ${totalMins} total minutes studied, avg ${Math.round(totalMins / Math.max(1, uniqueDays))} min/day.`;
    }

    const modeLabel = mode === "beast" ? "BEAST MODE (maximum intensity, push hard)" :
                      mode === "lazy" ? "LAZY MODE (gentle, basics, short sessions)" :
                      "NORMAL MODE (balanced approach)";

    let examContext = "";
    if (examDate) {
      const daysLeft = Math.max(0, Math.ceil((new Date(examDate).getTime() - Date.now()) / 86400000));
      examContext = `\nEXAM COUNTDOWN: ${daysLeft} days left until exam (${examDate}). ${
        daysLeft < 7 ? "CRITICAL: Exam is THIS WEEK. Focus on revision, formulae, and previous year questions ONLY." :
        daysLeft < 30 ? "URGENT: Less than a month left. Switch to intensive revision mode." :
        daysLeft < 90 ? "IMPORTANT: 3 months or less. Balance new topics with revision." :
        "Good time buffer. Focus on building strong foundations."
      }`;
    }

    let taskContext = "";
    if (dailyTasks && dailyTasks.length > 0) {
      const done = dailyTasks.filter((t: any) => t.done).length;
      taskContext = `\nTODAY'S TASKS: ${done}/${dailyTasks.length} completed (${Math.round((done / dailyTasks.length) * 100)}%). Consistency score: ${consistencyScore || 0}%`;
    }

    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY not configured");

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are ASTRA MENTOR — a powerful personalized AI study mentor for ${profile?.display_name || "Student"} on Rankers Star.

CURRENT MODE: ${modeLabel}
${examContext}
${studyInfo}
${taskContext}
${perfSummary}

Your capabilities:
1. DAILY PLANNING: Create specific daily study plans with exact time allocations.
2. TASK GENERATION: When asked for a plan, generate numbered tasks. Format: "1. [Task]"
3. WEAK TOPIC ATTACK: For weak topics: 1 key concept summary → suggest practice → recommend a test
4. MISTAKE ANALYSIS: Analyze error patterns and give specific fix strategies
5. SMART NUDGES: Honest, personalized nudges based on actual data
6. EXAM COUNTDOWN: Adapt intensity based on days left
7. INSTANT TASKS: When asked "what now?", give ONE specific task with exact time

Mode behavior:
- LAZY: Short sessions (30 min), only essentials, gentle tone, more breaks
- NORMAL: Balanced 4-6 hour plans, mix of study and practice
- BEAST: 8-10 hour intense plans, no excuses, aggressive targets, competitive tone

Rules:
- NEVER use LaTeX delimiters like $...$ or $$...$$
- Use simple symbols: √, π, ×, ÷, ^, /, ², ³
- Use markdown formatting
- When creating study plans, use numbered lists so tasks can be parsed
- Be specific with time: "9:00-11:00 Physics" not "some time for physics"
- Always reference actual performance data when available
- Celebrate improvements, be honest about weaknesses
- Keep responses focused and actionable`
          },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "AI service busy. Please try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("ASTRA Groq error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error. Please try again." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Tee stream — capture assistant content for history persistence
    const [streamForClient, streamForCapture] = response.body!.tee();
    (async () => {
      try {
        const reader = streamForCapture.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let assistant = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let idx: number;
          while ((idx = buf.indexOf("\n")) !== -1) {
            const line = buf.slice(0, idx).trim();
            buf = buf.slice(idx + 1);
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              const c = parsed.choices?.[0]?.delta?.content || "";
              assistant += c;
            } catch {}
          }
        }
        if (assistant.trim()) {
          await userClient.from("astra_chat_history").insert({
            user_id: user.id, role: "assistant", content: assistant.trim(),
          });
        }
      } catch (e) {
        console.error("history capture error:", e);
      }
    })();

    return new Response(streamForClient, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("astra-mentor error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
