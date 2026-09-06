import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DAILY_LIMIT = 3;
const BATCH_SIZE = 5;

type Difficulty = "easy" | "moderate" | "hard" | "very_hard";

const DIFFICULTY_BRIEF: Record<Difficulty, string> = {
  easy: "NCERT textbook level. Single-step, direct formula or direct recall questions.",
  moderate: "Standard JEE Main / NEET level. Two-step reasoning, typical exam questions.",
  hard: "Top-percentile level. Multi-concept, multi-step calculations, tricky distractors.",
  very_hard: "JEE Advanced killer level. Deep multi-concept problems, non-obvious traps, heavy reasoning.",
};

function istDate(): string {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 3600 * 1000);
  return ist.toISOString().split("T")[0];
}

type Scope = { subject: string | null; chapter: string | null; topics?: string[] };

function scopeText(scope: Scope): string {
  const s = scope.subject ? ` for the subject ${scope.subject}` : "";
  const c = scope.chapter ? `, specifically from the chapter "${scope.chapter}"` : "";
  const t = scope.topics && scope.topics.length
    ? `, restricted to these topics: ${scope.topics.join(", ")}`
    : "";
  return `${s}${c}${t}`;
}

async function generateBatch(
  apiKey: string,
  examType: string,
  scope: Scope,
  count: number,
  difficulty: Difficulty,
  integer: boolean,
  attempt = 1,
): Promise<any[]> {
  const integerInstr = integer
    ? `EVERY question in this batch must be an INTEGER-TYPE numerical question:
- "type" must be "integer", "options" must be an empty array, and "answer" must be the final numeric answer.
- The answer MUST be a non-negative integer (0 or more). No decimals, no negative values, no fractions.
- If the natural answer is negative or fractional, rephrase the question so the asked quantity is absolute/scaled (e.g. "give |x|", "give the value of 10x", "give the magnitude"), and say so inside the question text.
- If rounding is needed, the question text must say "answer to the nearest integer".
- "correctAnswer" must be -1 for integer questions.`
    : `Every question is a 4-option single-correct MCQ: "type" must be "mcq", exactly 4 options, "correctAnswer" is the index 0-3, and "answer" must be null.`;

  const prompt = `Generate exactly ${count} diverse ${examType} exam questions${scopeText(scope)}.

DIFFICULTY: ${difficulty.replace("_", " ").toUpperCase()} — ${DIFFICULTY_BRIEF[difficulty]}
Every question must genuinely match this difficulty level.

${integerInstr}

Return ONLY a JSON object with this exact structure (no markdown fences, no other text):
{"questions":[{"id":1,"type":"${integer ? "integer" : "mcq"}","question":"...","options":${integer ? "[]" : '["A","B","C","D"]'},"correctAnswer":${integer ? -1 : 0},"answer":${integer ? 42 : "null"},"explanation":"...","subject":"${scope.subject || "General"}","chapter":"${scope.chapter || ""}"}]}

Use LaTeX inside $...$ for any math. Keep explanations short and step-based.`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: "You are an expert paper setter for Indian competitive exams (JEE/NEET). You strictly respect the requested difficulty level and question type. Always return valid JSON only — no markdown, no commentary." },
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
        return generateBatch(apiKey, examType, scope, count, difficulty, integer, attempt + 1);
      }
      return [];
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      if (attempt < 4) return generateBatch(apiKey, examType, scope, count, difficulty, integer, attempt + 1);
      return [];
    }

    const parsed = JSON.parse(content);
    const qs = parsed.questions || [];
    if (!Array.isArray(qs) || qs.length === 0) {
      if (attempt < 4) return generateBatch(apiKey, examType, scope, count, difficulty, integer, attempt + 1);
      return [];
    }

    if (integer) {
      return qs
        .filter((q: any) => q && q.question && (typeof q.answer === "number" || !isNaN(Number(q.answer))))
        .map((q: any) => ({
          ...q,
          type: "integer",
          options: [],
          correctAnswer: -1,
          answer: Math.abs(Math.round(Number(q.answer))),
        }));
    }

    return qs
      .filter((q: any) =>
        q && q.question && Array.isArray(q.options) && q.options.length === 4 &&
        typeof q.correctAnswer === "number" && q.correctAnswer >= 0 && q.correctAnswer < 4
      )
      .map((q: any) => ({ ...q, type: "mcq", answer: null }));
  } catch (e) {
    console.error("Batch exception (attempt", attempt, "):", e);
    if (attempt < 4) {
      await new Promise(r => setTimeout(r, attempt * 600));
      return generateBatch(apiKey, examType, scope, count, difficulty, integer, attempt + 1);
    }
    return [];
  }
}

async function generateInParallel(
  apiKey: string,
  examType: string,
  scope: Scope,
  total: number,
  difficulty: Difficulty,
  integer: boolean,
): Promise<any[]> {
  if (total <= 0) return [];

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
        merged.push({ ...q, subject: q.subject || scope.subject || "General" });
      }
    }
    return merged;
  };

  const batches = buildBatches(total);
  const firstResults = await Promise.all(
    batches.map(c => generateBatch(apiKey, examType, scope, c, difficulty, integer))
  );
  let merged = dedupeMerge([], firstResults);

  for (let pass = 0; pass < 2 && merged.length < total; pass++) {
    const missing = total - merged.length;
    const fillBatches = buildBatches(Math.ceil(missing * 1.3));
    const fillResults = await Promise.all(
      fillBatches.map(c => generateBatch(apiKey, examType, scope, c, difficulty, integer))
    );
    merged = dedupeMerge(merged, fillResults);
  }

  return merged.slice(0, total);
}

/** Generates a scope's questions, splitting off an integer-type share when requested. */
async function generateScope(
  apiKey: string,
  examType: string,
  scope: Scope,
  total: number,
  difficulty: Difficulty,
  integerRatio: number,
): Promise<any[]> {
  const intCount = integerRatio > 0 ? Math.max(1, Math.round(total * integerRatio)) : 0;
  const mcqCount = Math.max(0, total - intCount);
  const [mcqs, ints] = await Promise.all([
    generateInParallel(apiKey, examType, scope, mcqCount, difficulty, false),
    generateInParallel(apiKey, examType, scope, intCount, difficulty, true),
  ]);
  return [...mcqs, ...ints];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const {
      examType,
      subject,
      chapter,
      topics,
      numQuestions,
      subjectDistribution,
      difficulty = "moderate",
      integerQuestions = false,
    } = body;

    const diff: Difficulty = ["easy", "moderate", "hard", "very_hard"].includes(difficulty)
      ? difficulty : "moderate";
    const integerRatio = integerQuestions ? 0.2 : 0;

    const GROQ_API_KEY = Deno.env.get("GROQ_TEST_API_KEY") || Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) throw new Error("GROQ_TEST_API_KEY is not configured");

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
        const { data: roles } = await userClient.from("user_roles").select("role").eq("user_id", user.id);
        const isAdmin = !!roles?.some((r: any) => r.role === "admin");
        if (!isAdmin) {
          const today = istDate();
          const { data: usage } = await userClient
            .from("ai_usage").select("count")
            .eq("user_id", user.id).eq("feature", "ai_test").eq("usage_date", today)
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
    }

    let allQuestions: any[] = [];

    if (subjectDistribution && Array.isArray(subjectDistribution)) {
      const perSubject = await Promise.all(
        subjectDistribution.map((dist: any) => {
          // Chapter-level plan: [{ subject, chapters: [{ name, topics, count }] }]
          if (Array.isArray(dist.chapters) && dist.chapters.length) {
            return Promise.all(
              dist.chapters.map((ch: any) =>
                generateScope(
                  GROQ_API_KEY, examType,
                  { subject: dist.subject, chapter: ch.name, topics: ch.topics || [] },
                  Number(ch.count) || 0, diff, integerRatio,
                ).catch(() => [] as any[])
              )
            ).then(arrs => arrs.flat());
          }
          return generateScope(
            GROQ_API_KEY, examType,
            { subject: dist.subject, chapter: chapter || null, topics: topics || [] },
            Number(dist.count) || 0, diff, integerRatio,
          ).catch(err => { console.error("subject failed:", dist.subject, err); return [] as any[]; });
        })
      );
      allQuestions = perSubject.flat();
    } else {
      allQuestions = await generateScope(
        GROQ_API_KEY, examType,
        { subject: subject || null, chapter: chapter || null, topics: topics || [] },
        numQuestions || 10, diff, integerRatio,
      );
    }

    allQuestions = allQuestions.map((q, i) => ({ ...q, id: i + 1 }));

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
