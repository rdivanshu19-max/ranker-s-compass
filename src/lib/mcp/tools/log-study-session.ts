import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "log_study_session",
  title: "Log a study session",
  description: "Record a study session (in minutes) for the signed-in student, counting toward streaks.",
  inputSchema: {
    duration_minutes: z.number().int().min(1).max(1440).describe("Minutes studied."),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Session date (YYYY-MM-DD). Defaults to today."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ duration_minutes, date }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const row: Record<string, unknown> = {
      user_id: ctx.getUserId(),
      duration_minutes,
    };
    if (date) row.date = date;
    const { data, error } = await supabase.from("study_sessions").insert(row).select();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Logged ${duration_minutes} minutes of study.` }],
      structuredContent: { session: data?.[0] ?? null },
    };
  },
});
