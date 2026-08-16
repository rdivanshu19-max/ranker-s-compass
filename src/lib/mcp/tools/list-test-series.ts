import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_test_series",
  title: "List test series",
  description: "List the test series published on Rankers, optionally filtered by a name search.",
  inputSchema: {
    search: z.string().trim().min(1).optional().describe("Filter test series by name."),
    limit: z.number().int().min(1).max(50).default(20).describe("Max test series to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("test_series")
      .select("id, name, description, logo_url, poster_url, sort_order")
      .order("sort_order", { ascending: true })
      .limit(limit ?? 20);
    if (search) query = query.ilike("name", `%${search}%`);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { series: data ?? [] },
    };
  },
});
