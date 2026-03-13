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
        system: `Sos un experto en jurisprudencia de Chubut, Argentina. Seguí estos pasos:

1. Accedé a esta URL y listá todos los fallos que aparecen: https://www.saij.gob.ar/resultados.jsp?o=0&p=25&f=Total%7CFecha%7CEstado%20de%20Vigencia%5B5%2C1%5D%7CTema%5B5%2C1%5D%7COrganismo%5B5%2C1%5D%7CAutor%5B5%2C1%5D%7CJurisdicci%F3n/Local/Chubut%7CTribunal%5B5%2C1%5D%7CPublicaci%F3n%5B5%2C1%5D%7CColecci%F3n%20tem%E1tica%5B5%2C1%5D%7CTipo%20de%20Documento/Jurisprudencia&s=fecha-rango|DESC&v=colapsada

2. Para cada fallo de la lista, entrá al enlace del fallo y leé el contenido completo. Luego escribí:
- TÍTULO del fallo
- TRIBUNAL y FECHA
- SUMARIO: 2-3 líneas explicando de qué trata, qué se resolvió y por qué es relevante
- ENLACE directo al fallo en SAIJ

3. Accedé a https://jusnoticias.juschubut.gov.ar y para cada posteo nuevo escribí:
- TÍTULO
- SUMARIO: 1-2 líneas
- ENLACE al posteo

Presentá todo ordenado por fecha, del más reciente al más antiguo.`,
        messages: [{ role: "user", content: "Buscá y resumí los fallos y novedades judiciales de Chubut." }]
      })
    });
    const data = await resp.json();
    const texto = data.content?.filter(b => b.type === "text").map(b => b.text).join("") || "Sin datos";
    await redis.set("judicial:diario", { texto, fecha: new Date().toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" }) }, { ex: 90000 });
    return res.status(200).json({ ok: true });
  }
  return res.status(405).end();
}