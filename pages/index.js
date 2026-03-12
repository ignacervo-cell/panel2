import { useState, useRef, useEffect } from "react";

const WEB_SEARCH_TOOL = [{ type: "web_search_20250305", name: "web_search" }];

const SYSTEM_JUDICIAL = `Eres un experto en comunicación judicial argentina con acceso a búsqueda web.

Cuando el usuario te comparta contenido, texto o PDF, generás el Doble Producto COMPLETO:

1. FICHA TÉCNICA (Uso Interno)
- Datos Duros: Expediente, fecha exacta (con hora si figura), montos con centavos, dominios de vehículos.
- Intervinientes: Jueces/Juezas (primer nombre y apellido), Fiscales y Defensores.
- Cronología: Hecho → Primera Instancia → Segunda Instancia.

2. NOTA DE PRENSA (Difusión)
- Lenguaje claro, enfoque institucional, cifras redondeadas.
- Anonimizar si hay menores, familia o delitos sexuales.
- Incluir citas textuales clave. Mencionar ciudad al inicio.
- Prohibido inventar. Sin consejos.`;

const SYSTEM_LIBRE = `Sos Claude, asistente de IA con acceso a búsqueda web. Podés leer URLs, buscar información actual y responder cualquier consulta. El usuario es Ignacio Soto, abogado de Trelew, Chubut, Argentina. Respondé en español. Sé directo y preciso.`;

const AGENTS = [
  { id: "judicial", label: "Agente Judicial", icon: "⚖️", accent: "#1a56a0", tag: "COMUNICACIÓN JUDICIAL", placeholder: "Pegá texto, URL o adjuntá un PDF...", system: SYSTEM_JUDICIAL },
  { id: "libre", label: "Agente Libre", icon: "🤖", accent: "#6c3fc5", tag: "ASISTENTE GENERAL", placeholder: "Escribí lo que necesitás o pegá una URL...", system: SYSTEM_LIBRE },
];

function getText(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.filter(b => b.type === "text").map(b => b.text).join("");
  return "";
}

function TypingDots({ color }) {
  return (
    <span style={{ display: "inline-flex", gap: 5, alignItems: "center" }}>
      {[0,1,2].map(i => (
        <span key={i} style={{ width:7, height:7, borderRadius:"50%", background:color, display:"inline-block", animation:`dot 1.2s ${i*0.2}s infinite ease-in-out` }} />
      ))}
      <style>{`@keyframes dot{0%,80%,100%{transform:translateY(0);opacity:0.4}40%{transform:translateY(-7px);opacity:1}}`}</style>
    </span>
  );
}

function Bubble({ msg, accent, icon }) {
  const isUser = msg.role === "user";
  const text = getText(msg.content);
  if (!text) return null;
  return (
    <div style={{ display:"flex", justifyContent:isUser?"flex-end":"flex-start", marginBottom:12 }}>
      {!isUser && (
        <div style={{ width:28, height:28, borderRadius:"50%", background:`${accent}22`, border:`1.5px solid ${accent}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, marginRight:8, flexShrink:0, marginTop:2 }}>
          {icon}
        </div>
      )}
      <div style={{ maxWidth:"76%", padding:"10px 14px", borderRadius:isUser?"18px 18px 4px 18px":"4px 18px 18px 18px", background:isUser?`linear-gradient(135deg, ${accent}, ${accent}cc)`:"#f4f6fb", color:isUser?"#fff":"#1c1e2d", fontSize:13.5, lineHeight:1.7, whiteSpace:"pre-wrap", wordBreak:"break-word", boxShadow:isUser?`0 3px 12px ${accent}44`:"0 1px 4px rgba(0,0,0,0.07)", fontFamily:"'Segoe UI', sans-serif" }}>
        {text}
      </div>
    </div>
  );
}

export default function App() {
  const [activeId, setActiveId] = useState("judicial");
  const [histories, setHistories] = useState({ judicial:[], libre:[] });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [agentStatus, setAgentStatus] = useState("");
  const [agentRunning, setAgentRunning] = useState(false);
  const [pdfName, setPdfName] = useState("");
  const [pdfBase64, setPdfBase64] = useState("");
  const fileInputRef = useRef(null);
  const agenteFileRef = useRef(null);
  const bottomRef = useRef(null);
  const agent = AGENTS.find(a => a.id === activeId);
  const messages = histories[activeId];

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, loading]);

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(",")[1];
      setPdfBase64(base64);
      setPdfName(file.name);
    };
    reader.readAsDataURL(file);
  }

  async function send() {
    const text = input.trim();
    if ((!text && !pdfBase64) || loading) return;

    let userContent = text || `📄 ${pdfName}`;
    const userMsg = { role:"user", content: userContent };
    const newHistory = [...messages, userMsg];
    setHistories(h => ({ ...h, [activeId]:newHistory }));
    setInput(""); setLoading(true); setStatus("");

    try {
      let apiMessages;
      if (pdfBase64) {
        apiMessages = [{
          role: "user",
          content: [
            { type: "document", source: { type: "base64", media_type: "application/pdf", data: pdfBase64 } },
            { type: "text", text: text || "Analizá este documento judicial y generá el Doble Producto." }
          ]
        }];
        setPdfBase64(""); setPdfName("");
      } else {
        apiMessages = newHistory.map(m => ({ role: m.role, content: getText(m.content) || m.content }));
      }

      let convo = apiMessages;
      while (true) {
        const res = await fetch("/api/chat", {
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({ model:"claude-haiku-4-5-20251001", max_tokens:4096, system:agent.system, tools:WEB_SEARCH_TOOL, messages:convo })
        });
        const data = await res.json();
        if (!data.content) throw new Error(data.error || "Sin respuesta");
        convo = [...convo, { role:"assistant", content:data.content }];
        if (data.stop_reason === "end_turn") {
          setHistories(h => ({ ...h, [activeId]:[...newHistory, { role:"assistant", content:getText(data.content) }] }));
          break;
        }
        if (data.stop_reason === "tool_use") {
          setStatus("🔍 Buscando...");
          const results = data.content.filter(b => b.type==="tool_use").map(b => ({ type:"tool_result", tool_use_id:b.id, content:"búsqueda completada" }));
          convo = [...convo, { role:"user", content:results }];
          continue;
        }
        const fallback = getText(data.content);
        if (fallback) setHistories(h => ({ ...h, [activeId]:[...newHistory, { role:"assistant", content:fallback }] }));
        break;
      }
    } catch(err) {
      setHistories(h => ({ ...h, [activeId]:[...newHistory, { role:"assistant", content:`Error: ${err.message}` }] }));
    } finally { setLoading(false); setStatus(""); }
  }

  async function runAgente(texto, pdfB64) {
    setAgentRunning(true);
    setAgentStatus("⚖️ Procesando...");
    try {
      const body = pdfB64 ? { pdf: pdfB64 } : { texto };
      const res = await fetch("/api/agente", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(body)
      });
      const data = await res.json();
      if (data.ok) setAgentStatus("✅ Resultado enviado a ignacervo@gmail.com");
      else setAgentStatus(`❌ Error: ${data.error}`);
    } catch(err) {
      setAgentStatus(`❌ Error: ${err.message}`);
    } finally { setAgentRunning(false); }
  }

  function handleAgenteFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(",")[1];
      runAgente(null, base64);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg, #0d1b3e 0%, #112254 40%, #1a1040 100%)", display:"flex", flexDirection:"column", alignItems:"center", fontFamily:"Georgia, serif", padding:"32px 16px" }}>
      <div style={{ width:"100%", maxWidth:680 }}>
        <div style={{ marginBottom:28, textAlign:"center" }}>
          <div style={{ fontSize:10, letterSpacing:4, color:"#5b7ec4", textTransform:"uppercase", marginBottom:6 }}>IGNACIO SOTO · TRELEW, CHUBUT</div>
          <h1 style={{ margin:0, fontSize:26, fontWeight:400, color:"#e8edf8", letterSpacing:1 }}>Panel de Agentes</h1>
          <div style={{ width:48, height:1.5, background:"linear-gradient(90deg, transparent, #4a7fd4, transparent)", margin:"10px auto 0" }} />
        </div>

        {/* Agente Autónomo */}
        <div style={{ background:"rgba(26,86,160,0.15)", border:"1.5px solid rgba(26,86,160,0.4)", borderRadius:16, padding:"16px 20px", marginBottom:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div>
              <div style={{ color:"#7baee8", fontSize:10, letterSpacing:2, textTransform:"uppercase" }}>AGENTE AUTÓNOMO</div>
              <div style={{ color:"#e8edf8", fontSize:14, fontWeight:600, fontFamily:"'Segoe UI', sans-serif" }}>⚖️ Procesar → Email</div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => agenteFileRef.current?.click()} disabled={agentRunning} style={{ background:"none", border:"1px solid #1a56a088", borderRadius:8, color:"#7baee8", fontSize:11, padding:"6px 12px", cursor:agentRunning?"not-allowed":"pointer", fontFamily:"'Segoe UI', sans-serif" }}>
                📎 PDF
              </button>
              <input ref={agenteFileRef} type="file" accept=".pdf" style={{ display:"none" }} onChange={handleAgenteFile} />
            </div>
          </div>
          <textarea id="agente-texto" placeholder="Pegá el texto del fallo aquí..." rows={2}
            style={{ width:"100%", background:"rgba(0,0,0,0.2)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, color:"#c8d8f0", fontSize:12, padding:"8px 10px", fontFamily:"'Segoe UI', sans-serif", resize:"none", outline:"none", boxSizing:"border-box" }}
          />
          <div style={{ marginTop:8, display:"flex", justifyContent:"flex-end" }}>
            <button onClick={() => { const t=document.getElementById("agente-texto"); runAgente(t.value, null); }} disabled={agentRunning}
              style={{ background:agentRunning?"#334":"linear-gradient(135deg, #1a56a0, #1a56a0cc)", border:"none", borderRadius:10, color:agentRunning?"#667":"#fff", fontSize:12, padding:"8px 20px", cursor:agentRunning?"not-allowed":"pointer", fontFamily:"'Segoe UI', sans-serif" }}>
              {agentRunning ? "Procesando..." : "▶ Enviar al email"}
            </button>
          </div>
          {agentStatus && <div style={{ marginTop:8, fontSize:12, color: agentStatus.startsWith("✅") ? "#4caf8a" : agentStatus.startsWith("❌") ? "#e57373" : "#7baee8", fontFamily:"'Segoe UI', sans-serif" }}>{agentStatus}</div>}
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:12, marginBottom:20 }}>
          {AGENTS.map(a => (
            <button key={a.id} onClick={() => { setActiveId(a.id); setStatus(""); }} style={{ flex:1, padding:"14px 12px", borderRadius:14, border:activeId===a.id?`1.5px solid ${a.accent}88`:"1.5px solid rgba(255,255,255,0.08)", background:activeId===a.id?`linear-gradient(135deg, ${a.accent}22, ${a.accent}11)`:"rgba(255,255,255,0.04)", color:activeId===a.id?"#e8edf8":"#6a7b9e", cursor:"pointer", fontFamily:"inherit", display:"flex", flexDirection:"column", alignItems:"center", gap:5, transition:"all 0.25s", backdropFilter:"blur(8px)", boxShadow:activeId===a.id?`0 4px 20px ${a.accent}33`:"none" }}>
              <span style={{ fontSize:24 }}>{a.icon}</span>
              <span style={{ fontSize:9, letterSpacing:2.5, color:activeId===a.id?a.accent:"#4a5a7a", textTransform:"uppercase" }}>{a.tag}</span>
              <span style={{ fontSize:13, fontWeight:activeId===a.id?600:400 }}>{a.label}</span>
            </button>
          ))}
        </div>

        {/* Chat */}
        <div style={{ background:"rgba(255,255,255,0.97)", borderRadius:20, boxShadow:`0 8px 48px rgba(0,0,0,0.35), 0 0 0 1px ${agent.accent}22`, overflow:"hidden" }}>
          <div style={{ padding:"14px 20px", borderBottom:"1px solid #eaedf5", display:"flex", justifyContent:"space-between", alignItems:"center", background:`linear-gradient(135deg, ${agent.accent}08, transparent)` }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:36, height:36, borderRadius:"50%", background:`${agent.accent}18`, border:`1.5px solid ${agent.accent}33`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17 }}>{agent.icon}</div>
              <div>
                <div style={{ fontWeight:700, fontSize:13.5, color:agent.accent, fontFamily:"'Segoe UI', sans-serif" }}>{agent.label}</div>
                <div style={{ fontSize:10, color:"#aab0c4", letterSpacing:1, fontFamily:"'Segoe UI', sans-serif" }}>{agent.tag} · 🌐 Web Search · 📎 PDF</div>
              </div>
            </div>
            <button onClick={() => setHistories(h => ({ ...h, [activeId]:[] }))} style={{ background:"none", border:"1px solid #e0e4ee", color:"#aab0c4", fontSize:11, padding:"5px 14px", borderRadius:8, cursor:"pointer", fontFamily:"'Segoe UI', sans-serif" }}>Limpiar</button>
          </div>

          <div style={{ minHeight:300, maxHeight:400, overflowY:"auto", padding:"20px 18px 10px" }}>
            {messages.length===0 && <div style={{ textAlign:"center", color:"#c8cedd", fontSize:13, marginTop:80, fontFamily:"'Segoe UI', sans-serif" }}><div style={{ fontSize:36, marginBottom:12, opacity:0.5 }}>{agent.icon}</div><div style={{ color:"#b0b8cc" }}>{agent.placeholder}</div></div>}
            {messages.map((m,i) => <Bubble key={i} msg={m} accent={agent.accent} icon={agent.icon} />)}
            {loading && (
              <div style={{ display:"flex", justifyContent:"flex-start", marginBottom:10, alignItems:"center", gap:10 }}>
                <div style={{ width:28, height:28, borderRadius:"50%", background:`${agent.accent}18`, border:`1.5px solid ${agent.accent}33`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, flexShrink:0 }}>{agent.icon}</div>
                <div style={{ padding:"10px 16px", borderRadius:"4px 16px 16px 16px", background:"#f4f6fb", display:"flex", flexDirection:"column", gap:6 }}>
                  {status && <div style={{ fontSize:11, color:"#8a94b0", fontFamily:"'Segoe UI', sans-serif" }}>{status}</div>}
                  <TypingDots color={agent.accent} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div style={{ padding:"14px 16px", borderTop:"1px solid #eaedf5", background:"#fafbfe" }}>
            {pdfName && (
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8, padding:"6px 12px", background:`${agent.accent}11`, borderRadius:8, border:`1px solid ${agent.accent}33` }}>
                <span style={{ fontSize:14 }}>📄</span>
                <span style={{ fontSize:12, color:agent.accent, fontFamily:"'Segoe UI', sans-serif", flex:1 }}>{pdfName}</span>
                <button onClick={() => { setPdfBase64(""); setPdfName(""); }} style={{ background:"none", border:"none", color:"#aaa", cursor:"pointer", fontSize:14 }}>✕</button>
              </div>
            )}
            <div style={{ display:"flex", gap:10, alignItems:"flex-end" }}>
              <button onClick={() => fileInputRef.current?.click()} style={{ background:"none", border:`1.5px solid ${agent.accent}44`, borderRadius:10, color:agent.accent, fontSize:18, width:42, height:42, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>📎</button>
              <input ref={fileInputRef} type="file" accept=".pdf" style={{ display:"none" }} onChange={handleFileChange} />
              <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();} }} placeholder={agent.placeholder} rows={2} style={{ flex:1, background:"#f2f4fb", border:`1.5px solid ${input||pdfBase64?agent.accent+"66":"#dde1ee"}`, borderRadius:12, color:"#1c1e2d", fontSize:13.5, padding:"10px 14px", fontFamily:"'Segoe UI', sans-serif", resize:"none", outline:"none", lineHeight:1.6 }} />
              <button onClick={send} disabled={loading||(!input.trim()&&!pdfBase64)} style={{ background:loading||(!input.trim()&&!pdfBase64)?"#e4e8f0":`linear-gradient(135deg, ${agent.accent}, ${agent.accent}cc)`, border:"none", borderRadius:12, color:loading||(!input.trim()&&!pdfBase64)?"#b0b8cc":"#fff", fontSize:18, width:46, height:46, cursor:loading||(!input.trim()&&!pdfBase64)?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>↑</button>
            </div>
          </div>
        </div>
        <div style={{ marginTop:14, textAlign:"center", fontSize:10, color:"#3a4a6a", letterSpacing:1.5, textTransform:"uppercase" }}>ENTER para enviar · SHIFT+ENTER nueva línea</div>
      </div>
    </div>
  );
}
