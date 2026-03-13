export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).end();
  }

  const { Redis } = await import("@upstash/redis");
  const redis = Redis.fromEnv();

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "web-search-2025-03-05",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      system: "Sos un asistente personal para alguien que vive en Trelew, Chubut, Argentina. Cada mañana generás un resumen con: 1) CLIMA: temperatura y recomendación para el día en Trelew. 2) NOTICIAS: 3 noticias relevantes de Trelew y Chubut de hoy. 3) PROMOCIONES: ofertas vigentes hoy en supermercados de Trelew con tarjetas Visa, Mastercard y Patagonia 365. 4) CINE: cartelera actual en Trelew. Sé concreto y útil.",
      messages: [{ role: "user", content: "Generá el resumen diario para Trelew, Chubut." }]
    })
  });

  const data = await response.json();
  const texto = data.content?.filter(b => b.type === "text").map(b => b.text).join("") || "Sin datos";

  await redis.set("libre:diario", {
    texto,
    fecha: new Date().toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })
  }, { ex: 90000 });

  return res.status(200).json({ ok: true });
}