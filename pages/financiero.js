import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function Financiero() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [gen, setGen] = useState(false);

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

  return (
    <div style={{ minHeight: "100vh", background: "#0d1b3e", padding: 32, fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <h1 style={{ color: "#fff", fontWeight: 400 }}>📈 Asesor Financiero</h1>
        <div style={{ background: "#fff", borderRadius: 16, padding: 24 }}>
          {data?.texto ? (
            <div>
              <p style={{ fontSize: 11, color: "#aaa" }}>{data.fecha}</p>
              <button onClick={generar} disabled={gen} style={{ background: "#1a7a4a", color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", marginBottom: 16, cursor: "pointer" }}>
                {gen ? "Generando..." : "🔄 Actualizar"}
              </button>
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
        <button onClick={() => router.push("/")} style={{ marginTop: 16, background: "none", border: "1px solid #3a4a6a", color: "#6a7b9e", borderRadius: 8, padding: "8px 20px", cursor: "pointer" }}>
          ← Volver
        </button>
      </div>
    </div>
  );
}