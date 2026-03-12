import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

async function procesarConClaude(contenido) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      system: `Eres un experto en comunicación judicial argentina. Analizá el texto y generá el Doble Producto COMPLETO sin cortar:

1. FICHA TÉCNICA (Uso Interno)
- Datos Duros: Expediente, fecha exacta (con hora si figura), montos con centavos, dominios de vehículos.
- Intervinientes: Jueces/Juezas (primer nombre y apellido), Fiscales y Defensores.
- Cronología: Hecho → Primera Instancia → Segunda Instancia.

2. NOTA DE PRENSA (Difusión)
- Lenguaje claro, enfoque institucional, cifras redondeadas.
- Anonimizar si hay menores, familia o delitos sexuales.
- Incluir citas textuales clave. Mencionar ciudad al inicio.
- Prohibido inventar. Sin consejos.`,
      messages: [{ role: "user", content: contenido }],
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text || "Sin respuesta";
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { texto, pdf } = req.body;
    let contenido = "";

    if (pdf) {
      // PDF en base64 — extraer texto via Claude
      const resExtract = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 4096,
          messages: [{
            role: "user",
            content: [
              { type: "document", source: { type: "base64", media_type: "application/pdf", data: pdf } },
              { type: "text", text: "Extraé todo el texto de este documento judicial." }
            ]
          }]
        }),
      });
      const dataExtract = await resExtract.json();
      contenido = dataExtract.content?.[0]?.text || "";
    } else {
      contenido = texto || "";
    }

    if (!contenido) return res.status(400).json({ error: "Sin contenido para procesar" });

    const resultado = await procesarConClaude(contenido);

    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "ignacervo@gmail.com",
      subject: "Agente Judicial — Nuevo procesamiento",
      html: `<div style="font-family: Arial; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${resultado.replace(/\n/g, '<br>')}</div>`,
    });

    return res.status(200).json({ ok: true, resultado });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
