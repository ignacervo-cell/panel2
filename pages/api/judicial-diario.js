import { Redis } from "@upstash/redis";
const redis = Redis.fromEnv();

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const d = await redis.get("judicial:diario");
      return res.status(200).json(d || {});
    } catch(e) { return res.status(200).json({}); }
  }
  if (req.method === "POST") {
    const { Redis } = await import("@upstash/redis");
    const r = Redis.fromEnv();
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "anthropic-beta": "web-search-2025-03-05" },
      body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 2048, tools: [{ type: "web_search_20250305", name: "web_search" }], system: "Buscá novedades judiciales de Chubut de hoy en SAIJ, JusNoticias y JusChubut. Resumí los fallos y noticias más relevantes con tribunal, tema y fecha.", messages: [{ role: "user", content: "Novedades judiciales Chubut hoy." }] })
    });
    const data = await resp.json();
    const texto = data.content?.filter(b => b.type === "text").map(b => b.text).join("") || "Sin datos";
    await r.set("judicial:diario", { texto, fecha: new Date().toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" }) }, { ex: 90000 });
    return res.status(200).json({ ok: true });
  }
  return res.status(405).end();
}