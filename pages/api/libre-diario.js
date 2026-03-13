import { Redis } from "@upstash/redis";
const redis = Redis.fromEnv();

const SITIOS_BASE = [
  "meteored.com.ar Trelew",
  "diariojornada.com.ar",
  "elchubut.com.ar",
  "adnpatagonia.com Trelew",
  "visa.com.ar promociones supermercados",
  "mastercard.com.ar promociones",
  "bancopatagonia.com.ar Patagonia365"
];

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const d = await redis.get("libre:diario");
      return res.status(200).json(d || {});
    } catch(e) { return res.status(200).json({}); }
  }
  if (req.method === "POST") {
    let sitiosExtra = [];
    try {
      sitiosExtra = await redis.get("libre:sitios") || [];
    } catch(e) {}

    const todosSitios = [...new Set([...SITIOS_BASE, ...sitiosExtra])].join(", ");

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "anthropic-beta": "web-search-2025-03-05" },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4096,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        system: `Sos un asistente personal para alguien en Trelew, Chubut. Usá estos sitios: ${todosSitios}

Generá el resumen diario con:

1. CLIMA HOY EN TRELEW: temperatura actual, máxima, mínima, viento. Recomendación práctica.

2. NOTICIAS TRELEW/CHUBUT: 4 noticias importantes de hoy con título, 2 líneas de resumen y enlace.

3. PROMOCIONES HOY: ofertas vigentes en supermercados de Trelew con Visa, Mastercard y Patagonia 365. Solo las que sean reales y verificables hoy.

4. CINE EN TRELEW: cartelera actual con películas y horarios.

5. Si encontrás sitios nuevos confiables con info de Trelew/Chubut, listalos al final bajo "NUEVOS SITIOS ENCONTRADOS:" uno por línea.`,
        messages: [{ role: "user", content: "Resumen diario Trelew hoy." }]
      })
    });

    const data = await resp.json();
    const texto = data.content?.filter(b => b.type === "text").map(b => b.text).join("") || "Sin datos";

    const match = texto.match(/NUEVOS SITIOS ENCONTRADOS:([\s\S]*?)(?:\n\n|$)/);
    if (match) {
      const nuevos = match[1].trim().split("\n").map(s => s.trim()).filter(Boolean);
      const actualizados = [...new Set([...sitiosExtra, ...nuevos])].slice(0, 30);
      await redis.set("libre:sitios", actualizados);
    }

    await redis.set("libre:diario", {
      texto,
      fecha: new Date().toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })
    }, { ex: 90000 });

    return res.status(200).json({ ok: true });
  }
  return res.status(405).end();
}