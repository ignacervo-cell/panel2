import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function FinancieroPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);

  async function cargar() {
    setLoading(true);
    try {
      const r = await fetch("/api/financiero");
      const d = await r.json();
      setData(d);
    } catch(e) {}
    setLoading(false);
  }

  async function generarAhora() {
    setGenerando(true);
    try {
      await fetch("/api/financiero", { method: "POST" });
      await cargar();
    } catch(e) {}
    setGenerando(false);
  }

  useEffect(() => { cargar(); }, []);

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg, #0d1b3e 0%, #0d2b1e 100%)", fontFamily:"Georgia, serif", padding:"32px 16px" }}>
      <div style={{ maxWidth:680, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ fontSize:10, letterSpacing:4, color:"#4a9a6a", textTransform:"uppercase", marginBottom:6 }}>IGNACIO SOTO · TRELEW</div>
          <h1 style={{ margin:0, fontSize:26, fontWeight:400, color:"#e8edf8", letterSpacing:1 }}>📈 Asesor Financiero</h1>
          <div style={{ width:48, height:1.5, background:"linear-gradient(90deg, transparent, #1a7a4a, transparent)", margin:"10px auto 0" }} />
        </div>

        <div style={{ background:"rgba(255,255,255,0.97)", borderRadius:20, overflow:"hidden", boxShadow:"0 8px 48px rgba(0,0,0,0.35)" }}>
          <div style={{ padding:"14px 20px", borderBottom:"1px solid #eaedf5", background:"linear-gradient(135deg, #1a7a4a08, transparent)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontWeight:700, fontSize:13.5, color:"#1a7a4a", fontFamily:"'Segoe UI', sans-serif" }}>Análisis Diario</div>
              {data?.fecha && <div style={{ fontSize:10, color:"#aab0c4", fontFamily:"'Segoe UI', sans-serif" }}>Actualizado: {data.fecha}</div>}
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={generarAhora} disabled={generando} style={{ background:generando?"#e4e8f0":"linear-gradient(135deg, #1a7a4a, #1a7a4acc)", border:"none", borderRadius:8, color:generando?"#b0b8cc":"#fff", fontSize:11, padding:"6px 14px", cursor:generando?"not-allowed":"pointer", fontFamily:"'Segoe UI', sans-serif" }}>
                {generando ? "Generando..." : "🔄 Actualizar ahora"}
              </button>
              <button onClick={() => router.push("/")} style={{ background:"none", border:"1px solid #e0e4ee", color:"#aab0c4", fontSize:11, padding:"5px 14px", borderRadius:8, cursor:"pointer", fontFamily:"'Segoe UI', sans-serif" }}>← Volver</button>
            </div>
          </div>

          <div style={{ padding:"24px 20px", minHeight:300 }}>
            {loading && <div style={{ textAlign:"center", color:"#b0b8cc", paddingTop:80, fontFamily:"'Segoe UI', sans-serif" }}>Cargando análisis...</div>}
            {!loading && !data?.texto && (
              <div style={{ textAlign:"center", paddingTop:60 }}>
                <div style={{ fontSize:36, marginBottom:12 }}>📈</div>
                <div style={{ color:"#b0b8cc", fontSize:13, fontFamily:"'Segoe UI', sans-serif", marginBottom:16 }}>No hay análisis todavía.</div>
                <button onClick={generarAhora} disabled={generando} style={{ background:"linear-gradient(135deg, #1a7a4a, #1a7a4acc)", border:"none", borderRadius:10, color:"#fff", fontSize:13, padding:"10px 24px", cursor:"pointer", fontFamily:"'Segoe UI', sans-serif" }}>
                  {generando ? "Generando..." : "▶ Generar primer análisis"}
                </button>
              </div>
            )}
            {!loading && data?.texto && (
              <div style={{ fontSize:14, lineHeight:1.8, color:"#1c1e2d", whiteSpace:"pre-wrap", fontFamily:"'Segoe UI', sans-serif" }}>
                {data.texto}
              </div>
            )}
          </div>
        </div>
        <div style={{ marginTop:14, textAlign:"center", fontSize:10, color:"#3a4a6a", letterSpacing:1.5, textTransform:"uppercase" }}>Se actualiza automáticamente cada mañana</div>
      </div>
    </div>
  );
}
