Deno.serve(async (req) => {
  const key = Deno.env.get("GROQ_CHAT_API_KEY")!;
  const { model, img } = await req.json();
  const content: any = img
    ? [{ type: "text", text: "what color is this image? one word" }, { type: "image_url", image_url: { url: img } }]
    : "say hi in 3 words";
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages: [{ role: "user", content }] }),
  });
  return new Response(await r.text(), { status: r.status });
});
