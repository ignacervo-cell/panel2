import { Redis } from "@upstash/redis";
const redis = Redis.fromEnv();

const SITIOS_BASE = [
  "jusnoticias.juschubut.gov.ar",
  "juschubut.gov.ar",
  "saij.gob.ar jurisprudencia Chubut",
  "diariojornada.com.ar judicial",
  "elchubut.com.ar tribunal"
];

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const d = await redis.get("judicial:diario");
      return res.status(200).json(d || {});
    } catch(e) { return res.status(200).json({}); }
  }
  if (req.method === "POST") {
    let sitiosExtra = [];
    try {
      sitiosExtra = await redis.get("judicial:sitios") || [];
    } catch(e) {}

    const todosSitios = [...new Set([...SITIOS_BASE, ...sitiosExtra])].join(", ");

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "anthropic-beta": "web-search-2025-03-05" },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4096,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        system: `Sos un experto en jurisprudencia de Chubut, Argentina. Hacé lo siguiente:

1. Buscá novedades judiciales recientes en estos sitios: ${todosSitios}

2. Para cada nota o fallo encontrá: título, tribunal/fuente, fecha, sumario de 2-3 líneas y enlace directo.

3. Si encontrás sitios nuevos confiables con información judicial de Chubut que no estén en la lista, listalos al final bajo el título "NUEVOS SITIOS ENCONTRADOS:" uno por línea.

4. Presentá todo ordenado del más reciente al más antiguo.`,
        messages: [{ role: "user", content: "Buscá novedades judiciales de Chubut." }]
      })
    });

    const data = await resp.json();
    const texto = data.content?.filter(b => b.type === "text").map(b => b.text).join("") || "Sin datos";

    // Extraer nuevos sitios y guardarlos
    const match = texto.match(/NUEVOS SITIOS ENCONTRADOS:([\s\S]*?)(?:\n\n|$)/);
    if (match) {
      const nuevos = match[1].trim().split("\n").map(s => s.trim()).filter(Boolean);
      const actualizados = [...new Set([...sitiosExtra, ...nuevos])].slice(0, 30);
      await redis.set("judicial:sitios", actualizados);
    }

    await redis.set("judicial:diario", {
      texto,
      fecha: new Date().toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })
    }, { ex: 90000 });

    return res.status(200).json({ ok: true });
  }
  return res.status(405).end();
}