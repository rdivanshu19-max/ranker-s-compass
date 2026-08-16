import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_study_apps",
  title: "List study apps",
  description: "List the study apps available on Rankers, optionally filtered by a name search.",
  inputSchema: {
    search: z.string().trim().min(1).optional().describe("Filter apps by name."),
    limit: z.number().int().min(1).max(50).default(20).describe("Max apps to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("study_apps")
      .select("id, name, description, logo_url, banner_url, sort_order")
      .order("sort_order", { ascending: true })
      .limit(limit ?? 20);
    if (search) query = query.ilike("name", `%${search}%`);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { apps: data ?? [] },
    };
  },
});
