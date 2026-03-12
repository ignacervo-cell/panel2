import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function Financiero() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [gen, setGen] = useState(false);
  const [input, setInput] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/financiero").then(r => r.json()).then(setData);
  }, []);

  async function generar() {
    setGen(true);
    await fetch("/api/financiero", { method: "POST" });
    const d = await fetch("/api/financiero").then(r => r.json());
    setData(d);
    setGen(false);
  }

  async function consultar() {
    if (!input.trim() || loading) return;
    const texto = input.trim();
    setInput("");
    setLoading(true);
    const nuevos = [...chat, { role: "user", content: texto }];
    setChat(nuevos);
    const r = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        system: "Sos asesor financiero argentino. Respondés consultas concretas sobre inversiones, dólar, tasas, CEDEARs, FCI, cripto. Buscás datos actuales cuando hace falta. Sos directo.",
        messages: nuevos
      })
    });
    const d = await r.json();
    const respuesta = d.content?.filter(b => b.type === "text").map(b => b.text).join("") || "Sin respuesta";
    setChat([...nuevos, { role: "assistant", content: respuesta }]);
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0d1b3e", padding: 32, fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <h1 style={{ color: "#fff", fontWeight: 400 }}>📈 Asesor Financiero</h1>

        <div style={{ background: "#fff", borderRadius: 16, padding: 24, marginBottom: 24 }}>
          {data?.texto ? (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 11, color: "#aaa" }}>{data.fecha}</span>
                <button onClick={generar} disabled={gen} style={{ background: "#1a7a4a", color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 11 }}>
                  {gen ? "Generando..." : "🔄 Actualizar"}
                </button>
              </div>
              <pre style={{ whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.8 }}>{data.texto}</pre>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: 40 }}>
              <button onClick={generar} disabled={gen} style={{ background: "#1a7a4a", color: "#fff", border: "none", borderRadius: 10, padding: "12px 28px", cursor: "pointer", fontSize: 14 }}>
                {gen ? "Generando..." : "▶ Generar primer análisis"}
              </button>
            </div>
          )}
        </div>

        {data?.texto && (
          <div style={{ background: "#fff", borderRadius: 16, padding: 24 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: "#1a7a4a", marginBottom: 16 }}>💬 Hacé una consulta</div>
            <div style={{ maxHeight: 300, overflowY: "auto", marginBottom: 12 }}>
              {chat.map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 8 }}>
                  <div style={{ maxWidth: "80%", padding: "8px 14px", borderRadius: 12, background: m.role === "user" ? "#1a7a4a" : "#f4f6fb", color: m.role === "user" ? "#fff" : "#1c1e2d", fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && <div style={{ color: "#aaa", fontSize: 12, padding: 8 }}>Consultando...</div>}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && consultar()} placeholder="¿Conviene comprar dólares hoy?" style={{ flex: 1, border: "1.5px solid #dde1ee", borderRadius: 10, padding: "10px 14px", fontSize: 13, outline: "none" }} />
              <button onClick={consultar} disabled={loading || !input.trim()} style={{ background: "#1a7a4a", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", cursor: "pointer", fontSize: 13 }}>↑</button>
            </div>
          </div>
        )}

        <button onClick={() => router.push("/")} style={{ marginTop: 16, background: "none", border: "1px solid #3a4a6a", color: "#6a7b9e", borderRadius: 8, padding: "8px 20px", cursor: "pointer" }}>
          ← Volver
        </button>
      </div>
    </div>
  );
}