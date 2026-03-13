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
      system: "Sos un experto en jurisprudencia de Chubut, Argentina. Buscá novedades judiciales del día en: 1) SAIJ Chubut (saij.gob.ar jurisprudencia Chubut), 2) JusNoticias Chubut, 3) JusChubut. Generá un resumen claro con los fallos y noticias más relevantes del día. Incluí tribunal, tema y fecha de cada item.",
      messages: [{ role: "user", content: "Buscá y resumí las novedades judiciales de Chubut de hoy." }]
    })
  });

  const data = await response.json();
  const texto = data.content?.filter(b => b.type === "text").map(b => b.text).join("") || "Sin novedades";

  await redis.set("judicial:diario", {
    texto,
    fecha: new Date().toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })
  }, { ex: 90000 });

  return res.status(200).json({ ok: true });
}