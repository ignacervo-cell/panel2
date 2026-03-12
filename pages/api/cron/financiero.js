import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  // Vercel cron sends GET, protegemos con secret
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "No autorizado" });
  }

  try {
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
        system: `Sos un asesor financiero experto para inversores argentinos. 
Buscá información actualizada y generá un análisis financiero diario con:
1. CONTEXTO DEL DÍA: Dólar oficial, blue, MEP. Inflación reciente. Tasas de plazos fijos.
2. RECOMENDACIÓN DEL DÍA: Qué conviene hacer hoy con los ahorros (FCI, plazo fijo, dólares, CEDEARs, cripto). Con porcentajes concretos.
3. ALERTA: Una oportunidad o riesgo importante del momento.
Sé directo, concreto, sin vueltas. Fecha de hoy al inicio.`,
        messages: [{ role: "user", content: "Generá el análisis financiero diario para inversores argentinos." }]
      })
    });

    const data = await response.json();
    const texto = data.content?.filter(b => b.type === "text").map(b => b.text).join("") || "Sin datos";

    await redis.set("financiero:ultimo", {
      texto,
      fecha: new Date().toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })
    }, { ex: 60 * 60 * 25 }); // 25 horas

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
