export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const { Redis } = await import("@upstash/redis");
      const r = Redis.fromEnv();
      const d = await r.get("financiero:ultimo");
      return res.status(200).json(d || {});
    } catch(e) {
      return res.status(200).json({});
    }
  }

  if (req.method === "POST") {
    try {
      const { Redis } = await import("@upstash/redis");
      const r = Redis.fromEnv();

      const resp = await fetch("https://api.anthropic.com/v1/messages", {
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
          system: "Sos asesor financiero argentino. Buscá datos actuales y generá análisis con: 1) Dólar blue, oficial, MEP de hoy. 2) Tasa plazo fijo actual. 3) Recomendación concreta con porcentajes. 4) Una alerta importante. Sé directo.",
          messages: [{ role: "user", content: "Análisis financiero de hoy." }]
        })
      });

      const data = await resp.json();
      const texto = data.content?.filter(b => b.type === "text").map(b => b.text).join("") || "Sin datos";

      await r.set("financiero:ultimo", {
        texto,
        fecha: new Date().toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })
      }, { ex: 90000 });

      return res.status(200).json({ ok: true });
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).end();
}