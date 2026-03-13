import { Redis } from "@upstash/redis";
const redis = Redis.fromEnv();

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const d = await redis.get("libre:diario");
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
        system: `Sos un asistente personal para alguien que vive en Trelew, Chubut, Argentina. Generá el resumen diario buscando información real y actualizada:

1. CLIMA HOY EN TRELEW: Buscá en meteored.com.ar o clima.com la temperatura actual, máxima, mínima, viento y condición. Dá una recomendación práctica (qué ropa ponerse, si llevar paraguas, etc).

2. NOTICIAS TRELEW/CHUBUT: Buscá en diariojornada.com.ar, elchubut.com.ar, y adnpatagonia.com las 4 noticias más importantes de hoy de Trelew y Chubut. Para cada una: título, 2 líneas de resumen y enlace.

3. PROMOCIONES HOY: Buscá promociones vigentes hoy en supermercados de Trelew con tarjetas Visa, Mastercard y Patagonia 365. Revisá los sitios de los bancos y las tarjetas.

4. CINE EN TRELEW: Buscá la cartelera actual del cine en Trelew. Listá las películas con horarios si están disponibles.

Usá datos reales de hoy. Incluí enlaces cuando tengas.`,
        messages: [{ role: "user", content: "Generá el resumen diario para Trelew, Chubut." }]
      })
    });
    const data = await resp.json();
    const texto = data.content?.filter(b => b.type === "text").map(b => b.text).join("") || "Sin datos";
    await redis.set("libre:diario", { texto, fecha: new Date().toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" }) }, { ex: 90000 });
    return res.status(200).json({ ok: true });
  }
  return res.status(405).end();
}