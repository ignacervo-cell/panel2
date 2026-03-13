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
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "anthropic-beta": "web-search-2025-03-05" },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4096,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        system: `Sos un experto en jurisprudencia de Chubut, Argentina. Buscá y resumí las novedades judiciales más recientes siguiendo estos pasos:

1. Buscá en jusnoticias.juschubut.gov.ar las últimas noticias. Para cada nota encontrá: título, fecha, sumario de 2 líneas y enlace.

2. Buscá en saij.gob.ar los fallos más recientes de Chubut (jurisprudencia). Para cada fallo: título, tribunal, fecha, sumario de 2-3 líneas con qué se resolvió y por qué es relevante, y enlace directo.

3. Buscá en juschubut.gov.ar noticias institucionales recientes.

Presentá todo ordenado del más reciente al más antiguo. Incluí siempre el enlace para cada item. Si no encontrás algo, buscalo de otra forma antes de decir que no hay.`,
        messages: [{ role: "user", content: "Buscá las novedades judiciales de Chubut más recientes." }]
      })
    });
    const data = await resp.json();
    const texto = data.content?.filter(b => b.type === "text").map(b => b.text).join("") || "Sin datos";
    await redis.set("judicial:diario", { texto, fecha: new Date().toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" }) }, { ex: 90000 });
    return res.status(200).json({ ok: true });
  }
  return res.status(405).end();
}