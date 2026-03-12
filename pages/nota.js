import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function NotaPage() {
  const router = useRouter();
  const { id } = router.query;
  const [nota, setNota] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    try {
      const data = localStorage.getItem(`nota_${id}`);
      if (data) setNota(JSON.parse(data));
    } catch(e) {}
    setLoading(false);
  }, [id]);

  function descargarPDF() {
    window.print();
  }

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#f8f9fa", fontFamily:"Georgia, serif" }}>
      <div style={{ color:"#666" }}>Cargando...</div>
    </div>
  );

  if (!nota) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#f8f9fa", fontFamily:"Georgia, serif" }}>
      <div style={{ textAlign:"center", color:"#666" }}>
        <div style={{ fontSize:48, marginBottom:16 }}>⚖️</div>
        <div>Nota no encontrada o expirada.</div>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
        }
      `}</style>
      <div style={{ minHeight:"100vh", background:"#f8f9fa", fontFamily:"Georgia, serif", padding:"40px 20px" }}>
        <div style={{ maxWidth:720, margin:"0 auto" }}>
          
          {/* Header */}
          <div style={{ background:"#1a56a0", color:"#fff", padding:"24px 32px", borderRadius:"12px 12px 0 0", marginBottom:0 }}>
            <div style={{ fontSize:10, letterSpacing:3, textTransform:"uppercase", opacity:0.7, marginBottom:6 }}>PODER JUDICIAL · CHUBUT</div>
            <h1 style={{ margin:0, fontSize:22, fontWeight:600, lineHeight:1.3 }}>Nota de Prensa</h1>
            <div style={{ fontSize:12, opacity:0.7, marginTop:6 }}>{nota.fecha || new Date().toLocaleDateString("es-AR", { day:"numeric", month:"long", year:"numeric" })}</div>
          </div>

          {/* Content */}
          <div style={{ background:"#fff", padding:"32px", borderRadius:"0 0 12px 12px", boxShadow:"0 4px 24px rgba(0,0,0,0.08)", lineHeight:1.8, fontSize:15, color:"#1c1e2d", whiteSpace:"pre-wrap" }}>
            {nota.notaPrensaTexto || nota.texto}
          </div>

          {/* Actions */}
          <div className="no-print" style={{ marginTop:24, display:"flex", gap:12, justifyContent:"center" }}>
            <button onClick={descargarPDF} style={{ background:"#1a56a0", color:"#fff", border:"none", borderRadius:10, padding:"12px 28px", fontSize:14, cursor:"pointer", fontFamily:"Georgia, serif", display:"flex", alignItems:"center", gap:8 }}>
              📄 Descargar PDF
            </button>
            <button onClick={() => router.push("/")} style={{ background:"none", color:"#1a56a0", border:"1.5px solid #1a56a0", borderRadius:10, padding:"12px 28px", fontSize:14, cursor:"pointer", fontFamily:"Georgia, serif" }}>
              ← Volver al Panel
            </button>
          </div>

          <div className="no-print" style={{ marginTop:16, textAlign:"center", fontSize:11, color:"#aaa" }}>
            Generado por el Panel de Agentes · Ignacio Soto · Trelew, Chubut
          </div>
        </div>
      </div>
    </>
  );
}
