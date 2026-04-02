import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function generateQuestions(apiKey: string, examType: string, subject: string | null, chapter: string | null, numQuestions: number): Promise<any[]> {
  let prompt = `Generate exactly ${numQuestions} multiple choice questions for ${examType} exam`;
  if (subject) prompt += ` for the subject ${subject}`;
  if (chapter) prompt += `, specifically from the chapter "${chapter}"`;
  prompt += `. Each question should be exam-level difficulty matching actual ${examType} patterns. Make questions challenging and varied.`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: `You are a question paper generator for Indian competitive exams (JEE/NEET). Generate high-quality, exam-level MCQ questions. Each question must have exactly 4 options with one correct answer. Return questions in strict JSON format only. Make questions diverse and cover different difficulty levels.`
        },
        { role: "user", content: prompt }
      ],
      tools: [{
        type: "function",
        function: {
          name: "generate_questions",
          description: "Generate MCQ questions for competitive exams",
          parameters: {
            type: "object",
            properties: {
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "number" },
                    question: { type: "string" },
                    options: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
                    correctAnswer: { type: "number", description: "Index 0-3 of correct option" },
                    explanation: { type: "string" },
                    subject: { type: "string" },
                    chapter: { type: "string" }
                  },
                  required: ["id", "question", "options", "correctAnswer", "explanation", "subject"]
                }
              }
            },
            required: ["questions"]
          }
        }
      }],
      tool_choice: { type: "function", function: { name: "generate_questions" } }
    }),
  });

  if (!response.ok) {
    const status = response.status;
    if (status === 429) throw new Error("Rate limit exceeded. Please try again in a moment.");
    if (status === 402) throw new Error("AI credits exhausted. Please try again later.");
    const t = await response.text();
    console.error("AI error:", status, t);
    throw new Error("Something went wrong generating questions. Please try again.");
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) throw new Error("No questions generated. Please try again.");

  const parsed = JSON.parse(toolCall.function.arguments);
  return parsed.questions || [];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { examType, subject, chapter, numQuestions, subjectDistribution } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let allQuestions: any[] = [];

    // If subjectDistribution is provided, generate questions per subject in chunks
    if (subjectDistribution && Array.isArray(subjectDistribution)) {
      for (const dist of subjectDistribution) {
        const qs = await generateQuestions(LOVABLE_API_KEY, examType, dist.subject, chapter, dist.count);
        // Ensure subject is set correctly
        const tagged = qs.map((q: any, i: number) => ({
          ...q,
          id: allQuestions.length + i + 1,
          subject: dist.subject,
        }));
        allQuestions = allQuestions.concat(tagged);
      }
    } else {
      // Single batch generation
      const batchSize = Math.min(numQuestions || 10, 30);
      const batches = Math.ceil((numQuestions || 10) / batchSize);
      
      for (let b = 0; b < batches; b++) {
        const remaining = (numQuestions || 10) - allQuestions.length;
        const count = Math.min(batchSize, remaining);
        if (count <= 0) break;
        
        const qs = await generateQuestions(LOVABLE_API_KEY, examType, subject, chapter, count);
        const tagged = qs.map((q: any, i: number) => ({
          ...q,
          id: allQuestions.length + i + 1,
        }));
        allQuestions = allQuestions.concat(tagged);
      }
    }

    return new Response(JSON.stringify({ questions: allQuestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-test error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Something went wrong. Please try again." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
