import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DAILY_LIMIT = 3;
const BATCH_SIZE = 5;

function istDate(): string {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 3600 * 1000);
  return ist.toISOString().split("T")[0];
}

async function generateBatch(
  apiKey: string,
  examType: string,
  subject: string | null,
  chapter: string | null,
  count: number,
  attempt = 1,
): Promise<any[]> {
  const subjectInstr = subject ? ` for the subject ${subject}` : "";
  const chapterInstr = chapter ? `, specifically from the chapter "${chapter}"` : "";
  const prompt = `Generate exactly ${count} diverse multiple choice questions for ${examType} exam${subjectInstr}${chapterInstr}. Each question should be exam-level difficulty matching actual ${examType} patterns.

Return ONLY a JSON object with this exact structure (no markdown fences, no other text):
{"questions":[{"id":1,"question":"...","options":["A","B","C","D"],"correctAnswer":0,"explanation":"...","subject":"${subject || "General"}","chapter":"${chapter || ""}"}]}

Each question must have exactly 4 options. correctAnswer is the index 0-3 of the correct option.`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are an expert MCQ question generator for Indian competitive exams (JEE/NEET). Always return valid JSON only — no markdown, no commentary." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error(`Groq batch error (attempt ${attempt}):`, response.status, t);
      if (attempt < 4) {
        await new Promise(r => setTimeout(r, attempt * 600));
        return generateBatch(apiKey, examType, subject, chapter, count, attempt + 1);
      }
      return [];
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      if (attempt < 4) return generateBatch(apiKey, examType, subject, chapter, count, attempt + 1);
      return [];
    }

    const parsed = JSON.parse(content);
    const qs = parsed.questions || [];
    if (!Array.isArray(qs) || qs.length === 0) {
      if (attempt < 4) return generateBatch(apiKey, examType, subject, chapter, count, attempt + 1);
      return [];
    }
    return qs.filter((q: any) =>
      q && q.question && Array.isArray(q.options) && q.options.length === 4 &&
      typeof q.correctAnswer === "number" && q.correctAnswer >= 0 && q.correctAnswer < 4
    );
  } catch (e) {
    console.error("Batch exception (attempt", attempt, "):", e);
    if (attempt < 4) {
      await new Promise(r => setTimeout(r, attempt * 600));
      return generateBatch(apiKey, examType, subject, chapter, count, attempt + 1);
    }
    return [];
  }
}

async function generateInParallel(
  apiKey: string,
  examType: string,
  subject: string | null,
  chapter: string | null,
  total: number,
): Promise<any[]> {
  const buildBatches = (n: number) => {
    const out: number[] = [];
    let r = n;
    while (r > 0) { const c = Math.min(BATCH_SIZE, r); out.push(c); r -= c; }
    return out;
  };

  const dedupeMerge = (existing: any[], incoming: any[][]) => {
    const seen = new Set<string>(existing.map(q => q.question.trim().toLowerCase().slice(0, 100)));
    const merged = [...existing];
    for (const batch of incoming) {
      for (const q of batch) {
        const key = q.question.trim().toLowerCase().slice(0, 100);
        if (seen.has(key)) continue;
        seen.add(key);
        merged.push({ ...q, subject: q.subject || subject || "General" });
      }
    }
    return merged;
  };

  // First pass: full parallel
  const batches = buildBatches(total);
  const firstResults = await Promise.all(
    batches.map(c => generateBatch(apiKey, examType, subject, chapter, c))
  );
  let merged = dedupeMerge([], firstResults);

  // Top-up passes: fill any shortfall (up to 2 retries)
  for (let pass = 0; pass < 2 && merged.length < total; pass++) {
    const missing = total - merged.length;
    const fillBatches = buildBatches(Math.ceil(missing * 1.3)); // overshoot for dedup loss
    const fillResults = await Promise.all(
      fillBatches.map(c => generateBatch(apiKey, examType, subject, chapter, c))
    );
    merged = dedupeMerge(merged, fillResults);
  }

  // Trim & re-id
  return merged.slice(0, total).map((q, i) => ({ ...q, id: i + 1 }));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { examType, subject, chapter, numQuestions, subjectDistribution } = await req.json();
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY is not configured");

    // Enforce daily limit
    const authHeader = req.headers.get("Authorization");
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
          .eq("feature", "ai_test")
          .eq("usage_date", today)
          .maybeSingle();
        const current = usage?.count ?? 0;
        if (current >= DAILY_LIMIT) {
          return new Response(JSON.stringify({
            error: `Daily limit reached (${DAILY_LIMIT} tests/day). Resets at midnight IST.`,
            limitReached: true,
          }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        if (usage) {
          await userClient.from("ai_usage").update({ count: current + 1 })
            .eq("user_id", user.id).eq("feature", "ai_test").eq("usage_date", today);
        } else {
          await userClient.from("ai_usage").insert({
            user_id: user.id, feature: "ai_test", usage_date: today, count: 1,
          });
        }
      }
    }

    let allQuestions: any[] = [];

    if (subjectDistribution && Array.isArray(subjectDistribution)) {
      // Parallelize across subjects too
      const perSubject = await Promise.all(
        subjectDistribution.map((dist: any) =>
          generateInParallel(GROQ_API_KEY, examType, dist.subject, chapter || null, dist.count)
            .catch(err => { console.error("subject failed:", dist.subject, err); return [] as any[]; })
        )
      );
      let id = 1;
      for (const arr of perSubject) {
        for (const q of arr) {
          allQuestions.push({ ...q, id: id++ });
        }
      }
    } else {
      allQuestions = await generateInParallel(
        GROQ_API_KEY, examType, subject || null, chapter || null, numQuestions || 10,
      );
    }

    if (allQuestions.length === 0) {
      throw new Error("Failed to generate questions. Please try again.");
    }

    return new Response(JSON.stringify({ questions: allQuestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-test error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Something went wrong." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
