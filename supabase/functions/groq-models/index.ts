Deno.serve(async () => {
  const key = Deno.env.get("GROQ_CHAT_API_KEY")!;
  const r = await fetch("https://api.groq.com/openai/v1/models", {
    headers: { Authorization: `Bearer ${key}` },
  });
  const j = await r.json();
  return Response.json((j.data || []).map((m: any) => m.id));
});
