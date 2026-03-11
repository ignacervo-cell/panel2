import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

async function fetchEurekaFallos() {
  const url = "https://apps1cloud.juschubut.gov.ar/Eureka/Sentencias/Buscar/Fallos/";
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  const html = await res.text();
  return html;
}

async function procesarConClaude(texto) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      system: `Eres un experto en comunicación judicial argentina. Analizá el texto y generá el Doble Producto:

1. FICHA TÉCNICA (Uso Interno)
- Datos Duros: Expediente, fecha exacta (con hora si figura), montos con centavos, dominios de vehículos.
- Intervinientes: Jueces/Juezas (primer nombre y apellido), Fiscales y Defensores.
- Cronología: Hecho → Primera Instancia → Segunda Instancia.

2. NOTA DE PRENSA (Difusión)
- Lenguaje claro, enfoque institucional, cifras redondeadas.
- Anonimizar si hay menores, familia o delitos sexuales.
- Incluir citas textuales clave. Mencionar ciudad al inicio.
- Prohibido inventar. Sin consejos.`,
      messages: [{ role: "user", content: texto }],
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text || "Sin respuesta";
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    // Si viene texto del usuario (fallo subido manualmente)
    const { texto } = req.body;

    let contenido = texto;

    // Si no hay texto manual, buscar en Eureka
    if (!contenido) {
      const html = await fetchEurekaFallos();
      // Extraer texto relevante del HTML
      contenido = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").slice(0, 8000);
    }

    const resultado = await procesarConClaude(contenido);

    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "ignacervo@gmail.com",
      subject: "Agente Judicial — Nuevo procesamiento",
      html: `<pre style="font-family: Arial; font-size: 14px; white-space: pre-wrap;">${resultado}</pre>`,
    });

    return res.status(200).json({ ok: true, resultado });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
