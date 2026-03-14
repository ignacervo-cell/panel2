import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function Nota() {
  const router = useRouter();
  const { id } = router.query;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/nota?id=${id}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  function copiar() {
    if (data?.texto) navigator.clipboard.writeText(data.texto);
  }

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#e8edf8,#f0f4ff)", padding:"32px 16px", fontFamily:"Georgia, serif" }}>
      <div style={{ maxWidth:720, margin:"0 auto" }}>
        <div style={{ marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:9, letterSpacing:4, color:"#8a9ab0", textTransform:"uppercase", fontFamily:"'Courier New',monospace", marginBottom:4 }}>NOTA DE PRENSA</div>
            <h1 style={{ margin:0, fontSize:20, fontWeight:400, color:"#1a2a50" }}>Comunicación Judicial</h1>
          </div>
          <button onClick={() => window.close()} style={{ background:"none", border:"1px solid #c0c8e0", borderRadius:8, color:"#6a7a9a", fontSize:12, padding:"7px 16px", cursor:"pointer" }}>✕ Cerrar</button>
        </div>

        {loading ? (
          <div style={{ textAlign:"center", padding:60, color:"#8a9ab0", fontFamily:"'Courier New',monospace", fontSize:13 }}>Cargando...</div>
        ) : !data?.texto ? (
          <div style={{ textAlign:"center", padding:60 }}>
            <div style={{ fontSize:36, marginBottom:12 }}>📄</div>
            <div style={{ color:"#8a9ab0", fontFamily:"'Courier New',monospace", fontSize:13 }}>Nota no encontrada o expirada.</div>
          </div>
        ) : (
          <div style={{ background:"#fff", borderRadius:16, padding:32, boxShadow:"0 4px 24px rgba(0,0,0,0.08)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, paddingBottom:16, borderBottom:"1px solid #e8edf5" }}>
              <div style={{ fontSize:11, color:"#8a9ab0", fontFamily:"'Courier New',monospace" }}>{data.fecha}</div>
              <button onClick={copiar} style={{ background:"linear-gradient(135deg,#2563eb,#1d4ed8)", border:"none", borderRadius:8, color:"#fff", fontSize:11, padding:"7px 18px", cursor:"pointer", fontFamily:"'Courier New',monospace" }}>📋 Copiar texto</button>
            </div>
            <div style={{ fontSize:15, lineHeight:1.9, color:"#1a2a50", whiteSpace:"pre-wrap" }}>{data.texto}</div>
          </div>
        )}
      </div>
    </div>
  );
}
