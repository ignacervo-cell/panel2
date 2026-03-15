import { useState, useRef, useEffect } from "react";

const PASSWORD = "trelew2026";

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return mobile;
}

const SYSTEM_JUDICIAL = `Sos un experto en comunicación judicial argentina con acceso a búsqueda web.
Analizás documentos judiciales y generás el Doble Producto COMPLETO.
Al final incluí la nota de prensa entre estos marcadores:
===NOTA_PRENSA_INICIO===
(texto de la nota lista para publicar)
===NOTA_PRENSA_FIN===
1. FICHA TÉCNICA: Expediente, fecha, montos, intervinientes, cronología.
2. NOTA DE PRENSA: Lenguaje claro, institucional, cifras redondeadas. Anonimizar menores/familia/sexuales. Prohibido inventar.`;

const SYSTEM_LIBRE = `Sos Claude, asistente general con búsqueda web. El usuario es Ignacio Soto, abogado de Trelew, Chubut. Respondé en español, directo y útil.`;

const SYSTEM_FINANCIERO = `Sos asesor financiero argentino con búsqueda web en tiempo real. Buscás datos actuales de dólar blue, oficial, MEP, tasas y mercados. Directo y concreto. Usuario: Ignacio Soto, Trelew, Chubut.`;

const AGENTS = [
  { id:"judicial", label:"Agente Judicial", icon:"⚖️", tag:"COMUNICACIÓN JUDICIAL", accent:"#60a5fa", system:SYSTEM_JUDICIAL, diarioApi:"/api/judicial-diario", placeholder:"Adjuntá un fallo o pegá texto..." },
  { id:"libre", label:"Agente Libre", icon:"🤖", tag:"ASISTENTE GENERAL", accent:"#a78bfa", system:SYSTEM_LIBRE, diarioApi:"/api/libre-diario", placeholder:"Preguntá cualquier cosa..." },
  { id:"financiero", label:"Agente Financiero", icon:"📈", tag:"ASESOR FINANCIERO", accent:"#34d399", system:SYSTEM_FINANCIERO, diarioApi:"/api/financiero", placeholder:"Consultá sobre dólar, inversiones..." },
];

const ACCEPTED = ".pdf,.jpg,.jpeg,.png,.gif,.webp,.txt";

function getText(c) {
  if (typeof c === "string") return c;
  if (Array.isArray(c)) return c.filter(b => b.type === "text").map(b => b.text).join("");
  return "";
}

function fileToBase64(f) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(",")[1]);
    r.onerror = () => rej(new Error("Error leyendo archivo"));
    r.readAsDataURL(f);
  });
}

function getMediaType(f) {
  if (f.type) return f.type;
  const e = f.name.split(".").pop().toLowerCase();
  return { pdf:"application/pdf", jpg:"image/jpeg", jpeg:"image/jpeg", png:"image/png", gif:"image/gif", webp:"image/webp", txt:"text/plain" }[e] || "application/octet-stream";
}

function extractNota(t) {
  const m = t.match(/===NOTA_PRENSA_INICIO===([\s\S]*?)===NOTA_PRENSA_FIN===/);
  return m ? m[1].trim() : null;
}

function cleanText(t) {
  return t.replace(/===NOTA_PRENSA_INICIO===[\s\S]*?===NOTA_PRENSA_FIN===/g, "").trim();
}

function uid() { return Math.random().toString(36).substr(2, 9) + Date.now().toString(36); }

const G = "rgba(255,255,255,";

function TypingDots({ color }) {
  return (
    <span style={{ display:"inline-flex", gap:4, alignItems:"center" }}>
      {[0,1,2].map(i => <span key={i} style={{ width:6, height:6, borderRadius:"50%", background:color, display:"inline-block", animation:`dot 1.2s ${i*0.18}s infinite ease-in-out` }} />)}
      <style>{`@keyframes dot{0%,80%,100%{transform:scale(0.5);opacity:0.3}40%{transform:scale(1);opacity:1}}`}</style>
    </span>
  );
}

function PasswordGate({ onUnlock }) {
  const [val, setVal] = useState("");
  const [err, setErr] = useState(false);
  const [show, setShow] = useState(false);
  function check() { if (val === PASSWORD) { onUnlock(); } else { setErr(true); setVal(""); setTimeout(() => setErr(false), 1500); } }
  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#1a1a2e,#16213e,#0f3460,#533483)", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center", padding:40, background:G+"0.08)", backdropFilter:"blur(20px)", borderRadius:20, border:`1px solid ${G+"0.2)"}` }}>
        <div style={{ fontSize:52, marginBottom:12 }}>⚖️</div>
        <div style={{ fontSize:10, letterSpacing:5, color:G+"0.4)", textTransform:"uppercase", marginBottom:6, fontFamily:"'Courier New',monospace" }}>ACCESO RESTRINGIDO</div>
        <h1 style={{ margin:"0 0 28px", fontSize:20, fontWeight:400, color:G+"0.9)", letterSpacing:2, fontFamily:"Georgia,serif" }}>Panel de Agentes</h1>
        <div style={{ position:"relative", display:"inline-flex", alignItems:"center" }}>
          <input type={show?"text":"password"} value={val} onChange={e=>setVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&check()} placeholder="Contraseña" autoFocus
            style={{ background:G+"0.08)", backdropFilter:"blur(10px)", border:`1.5px solid ${err?"#ef4444":G+"0.2)"}`, borderRadius:12, color:G+"0.9)", fontSize:14, padding:"12px 44px 12px 16px", width:220, outline:"none", fontFamily:"'Courier New',monospace" }} />
          <button onClick={()=>setShow(!show)} style={{ position:"absolute", right:12, background:"none", border:"none", color:G+"0.5)", cursor:"pointer", fontSize:14 }}>{show?"🙈":"👁️"}</button>
        </div>
        <div style={{ marginTop:14 }}>
          <button onClick={check} style={{ background:"linear-gradient(135deg,#2563eb,#7c3aed)", border:"none", borderRadius:10, color:"#fff", fontSize:13, padding:"11px 32px", cursor:"pointer", fontFamily:"Georgia,serif" }}>Ingresar →</button>
        </div>
        {err && <div style={{ marginTop:10, fontSize:12, color:"#f87171", fontFamily:"'Courier New',monospace" }}>Contraseña incorrecta</div>}
      </div>
    </div>
  );
}

function SummaryPanel({ agent }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [init, setInit] = useState(false);
  useEffect(() => {
    fetch(agent.diarioApi).then(r=>r.json()).then(d=>{setData(d);setInit(true);}).catch(()=>setInit(true));
  }, [agent.id]);
  async function refresh() {
    setLoading(true);
    await fetch(agent.diarioApi, { method:"POST" }).catch(()=>{});
    const d = await fetch(agent.diarioApi).then(r=>r.json()).catch(()=>({}));
    setData(d); setLoading(false);
  }
  return (
    <div style={{ background:G+"0.05)", border:`1px solid ${G+"0.15)"}`, borderRadius:10, marginBottom:14, overflow:"hidden" }}>
      <div style={{ padding:"7px 12px", borderBottom:`1px solid ${G+"0.1)"}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontSize:9.5, letterSpacing:1.5, color:G+"0.6)", fontFamily:"'Courier New',monospace" }}>{data?.fecha ? `📅 ${data.fecha}` : "RESUMEN DIARIO"}</div>
        <button onClick={refresh} disabled={loading} style={{ background:G+"0.1)", border:`1px solid ${G+"0.2)"}`, borderRadius:6, color:G+"0.7)", fontSize:9.5, padding:"3px 10px", cursor:"pointer", fontFamily:"'Courier New',monospace" }}>{loading?"...":"↻ Act."}</button>
      </div>
      <div style={{ padding:"10px 12px", maxHeight:260, overflowY:"auto" }}>
        {!init ? <div style={{ color:G+"0.3)", fontSize:11, fontFamily:"'Courier New',monospace" }}>Cargando...</div>
        : data?.texto ? <div style={{ fontSize:11.5, color:G+"0.85)", lineHeight:1.85, whiteSpace:"pre-wrap", fontFamily:"'Courier New',monospace" }}>{data.texto}</div>
        : <div style={{ textAlign:"center", padding:"14px 0" }}>
            <div style={{ fontSize:10, color:G+"0.3)", fontFamily:"'Courier New',monospace", marginBottom:8 }}>Sin datos del día</div>
            <button onClick={refresh} disabled={loading} style={{ background:`linear-gradient(135deg,${agent.accent}88,${agent.accent}55)`, border:`1px solid ${agent.accent}66`, borderRadius:7, color:"#fff", fontSize:10, padding:"7px 18px", cursor:"pointer", fontFamily:"'Courier New',monospace" }}>{loading?"Generando...":"▶ Generar"}</button>
          </div>}
      </div>
    </div>
  );
}

function NotaInline({ notaId, agent }) {
  const [nota, setNota] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState("");
  useEffect(() => {
    fetch(`/api/nota?id=${notaId}`).then(r=>r.json()).then(d=>{
      if (d?.texto) { setNota(d); setTexto(d.texto); }
      setLoading(false);
    }).catch(()=>setLoading(false));
  }, [notaId]);
  async function guardar() {
    await fetch("/api/nota", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ id:notaId, texto, fecha:nota?.fecha }) });
    setNota({...nota, texto}); setEditando(false);
  }
  if (loading) return <div style={{ marginTop:8, fontSize:10, color:G+"0.4)", fontFamily:"'Courier New',monospace" }}>Cargando nota...</div>;
  if (!nota) return null;
  return (
    <div style={{ marginTop:10, background:G+"0.07)", border:`1px solid ${G+"0.2)"}`, borderRadius:10, overflow:"hidden", maxWidth:"92%", backdropFilter:"blur(10px)" }}>
      <div style={{ padding:"7px 12px", background:G+"0.05)", borderBottom:`1px solid ${G+"0.1)"}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontSize:9.5, letterSpacing:1.5, color:G+"0.6)", fontFamily:"'Courier New',monospace" }}>📰 NOTA DE PRENSA · {nota.fecha}</div>
        <div style={{ display:"flex", gap:6 }}>
          <button onClick={()=>setEditando(!editando)} style={{ background:G+"0.1)", border:`1px solid ${G+"0.2)"}`, borderRadius:5, color:G+"0.7)", fontSize:9.5, padding:"2px 9px", cursor:"pointer", fontFamily:"'Courier New',monospace" }}>{editando?"cancelar":"✏️ editar"}</button>
          <button onClick={()=>window.open(`/nota?id=${notaId}`,"_blank")} style={{ background:`linear-gradient(135deg,${agent.accent}88,${agent.accent}55)`, border:"none", borderRadius:5, color:"#fff", fontSize:9.5, padding:"2px 9px", cursor:"pointer", fontFamily:"'Courier New',monospace" }}>🔗 abrir</button>
        </div>
      </div>
      <div style={{ padding:"12px 14px" }}>
        {editando ? (
          <div>
            <textarea value={texto} onChange={e=>setTexto(e.target.value)} rows={10}
              style={{ width:"100%", background:G+"0.06)", border:`1px solid ${G+"0.15)"}`, borderRadius:7, color:G+"0.9)", fontSize:12, padding:"8px", fontFamily:"Georgia,serif", lineHeight:1.7, resize:"vertical", outline:"none", boxSizing:"border-box" }} />
            <button onClick={guardar} style={{ marginTop:8, background:`linear-gradient(135deg,${agent.accent},${agent.accent}99)`, border:"none", borderRadius:7, color:"#fff", fontSize:11, padding:"7px 20px", cursor:"pointer", fontFamily:"'Courier New',monospace" }}>💾 Guardar</button>
          </div>
        ) : (
          <div style={{ fontSize:13, lineHeight:1.85, color:G+"0.88)", whiteSpace:"pre-wrap", fontFamily:"Georgia,serif" }}>{nota.texto}</div>
        )}
      </div>
    </div>
  );
}

async function callChat(system, messages, setStatus) {
  let convo = messages.map(m => ({ role:m.role, content:m.content }));
  while (true) {
    const res = await fetch("/api/chat", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({ model:"claude-haiku-4-5-20251001", max_tokens:4096, system, tools:[{ type:"web_search_20250305", name:"web_search" }], messages:convo })
    });
    const data = await res.json();
    if (!data.content) throw new Error(data.error || data.type || "Sin respuesta de la API");
    convo = [...convo, { role:"assistant", content:data.content }];
    if (data.stop_reason === "end_turn") {
      return { text: getText(data.content), convo };
    }
    if (data.stop_reason === "tool_use") {
      if (setStatus) setStatus("🔍 Buscando...");
      const results = data.content.filter(b=>b.type==="tool_use").map(b=>({ type:"tool_result", tool_use_id:b.id, content:"búsqueda completada" }));
      convo = [...convo, { role:"user", content:results }];
      continue;
    }
    return { text: getText(data.content), convo };
  }
}

function ChatPanel({ agent }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [attached, setAttached] = useState(null);
  const [listening, setListening] = useState(false);
  const fileRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef("");
  const voiceRef = useRef("");

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, loading]);

  function startVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    voiceRef.current = "";
    const rec = new SR();
    rec.lang = "es-AR"; rec.continuous = false; rec.interimResults = false;
    rec.onresult = e => { voiceRef.current = e.results[0][0].transcript; };
    rec.onerror = () => setListening(false);
    rec.onend = () => {
      setListening(false);
      if (voiceRef.current) {
        const txt = (inputRef.current + " " + voiceRef.current).trim();
        voiceRef.current = ""; setInput(""); inputRef.current = "";
        sendMessage(txt, attached);
        setAttached(null);
      }
    };
    rec.start(); setListening(true);
  }

  async function handleFile(e) {
    const f = e.target.files[0]; if (!f) return;
    const b = await fileToBase64(f);
    setAttached({ name:f.name, base64:b, mediaType:getMediaType(f) });
    e.target.value = "";
  }

  function buildContent(text, file) {
    if (!file) return text;
    const parts = [];
    if (file.mediaType === "application/pdf") parts.push({ type:"document", source:{ type:"base64", media_type:"application/pdf", data:file.base64 } });
    else if (file.mediaType.startsWith("image/")) parts.push({ type:"image", source:{ type:"base64", media_type:file.mediaType, data:file.base64 } });
    parts.push({ type:"text", text: text || "Analizá este archivo." });
    return parts;
  }

  async function sendMessage(text, att) {
    if (!text && !att) return;
    const display = att ? `📎 ${att.name}${text ? "\n"+text : ""}` : text;
    const userMsg = { role:"user", content:buildContent(text, att), display };
    const hist = [...messages, userMsg];
    setMessages(hist); setLoading(true); setStatus("");
    try {
      const { text: fullText } = await callChat(agent.system, hist, setStatus);
      let notaTexto = agent.id === "judicial" ? extractNota(fullText) : null;
      if (agent.id === "judicial" && !notaTexto) {
        setStatus("📰 Extrayendo nota...");
        try {
          const r2 = await fetch("/api/chat", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ model:"claude-haiku-4-5-20251001", max_tokens:2048, system:"Escribí SOLO la nota de prensa del fallo analizado, lista para publicar.", messages:[...hist, { role:"user", content:"Escribí la nota de prensa completa." }] }) });
          const d2 = await r2.json();
          notaTexto = getText(d2.content) || null;
        } catch(e) {}
      }
      const clean = cleanText(fullText);
      let notaId = null;
      if (notaTexto) {
        notaId = uid();
        try {
          const fecha = new Date().toLocaleDateString("es-AR", { day:"numeric", month:"long", year:"numeric" });
          await fetch("/api/nota", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ id:notaId, texto:notaTexto, fecha }) });
        } catch(e) {}
      }
      setMessages([...hist, { role:"assistant", content:clean, display:clean, notaId }]);
    } catch(err) {
      setMessages([...hist, { role:"assistant", content:`Error: ${err.message}`, display:`Error: ${err.message}` }]);
    } finally { setLoading(false); setStatus(""); }
  }

  function send() {
    const text = input.trim();
    if ((!text && !attached) || loading) return;
    const att = attached;
    setInput(""); inputRef.current = ""; setAttached(null);
    sendMessage(text, att);
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", flex:1, minHeight:0 }}>
      <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:8, paddingBottom:8, minHeight:120 }}>
        {messages.length === 0 && (
          <div style={{ textAlign:"center", marginTop:40, opacity:0.3 }}>
            <div style={{ fontSize:28, marginBottom:6 }}>{agent.icon}</div>
            <div style={{ fontSize:11, color:G+"0.4)", fontFamily:"'Courier New',monospace" }}>Listo para trabajar</div>
          </div>
        )}
        {messages.map((m, i) => {
          const isUser = m.role === "user";
          const text = m.display || getText(m.content);
          if (!text) return null;
          return (
            <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:isUser?"flex-end":"flex-start" }}>
              <div style={{ maxWidth:"88%", padding:"9px 13px", borderRadius:isUser?"14px 14px 3px 14px":"3px 14px 14px 14px", background:isUser?`linear-gradient(135deg,${agent.accent}cc,${agent.accent}88)`:G+"0.08)", color:"rgba(255,255,255,0.9)", fontSize:12.5, lineHeight:1.75, whiteSpace:"pre-wrap", wordBreak:"break-word", fontFamily:"'Courier New',monospace", border:isUser?"none":`1px solid ${G+"0.1)"}` }}>{text}</div>
              {m.notaId && <NotaInline notaId={m.notaId} agent={agent} />}
            </div>
          );
        })}
        {loading && (
          <div style={{ display:"flex" }}>
            <div style={{ padding:"8px 13px", background:G+"0.08)", border:`1px solid ${G+"0.1)"}`, borderRadius:"3px 14px 14px 14px", display:"flex", flexDirection:"column", gap:4 }}>
              {status && <div style={{ fontSize:10, color:G+"0.5)", fontFamily:"'Courier New',monospace" }}>{status}</div>}
              <TypingDots color={agent.accent} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ borderTop:`1px solid ${G+"0.1)"}`, paddingTop:10, marginTop:4, flexShrink:0 }}>
        {attached && (
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:7, padding:"5px 10px", background:G+"0.08)", borderRadius:7, border:`1px solid ${G+"0.15)"}` }}>
            <span style={{ fontSize:12 }}>{attached.mediaType.startsWith("image/")?"🖼️":"📄"}</span>
            <span style={{ fontSize:10, color:G+"0.8)", flex:1, fontFamily:"'Courier New',monospace", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{attached.name}</span>
            <button onClick={()=>setAttached(null)} style={{ background:"none", border:"none", color:G+"0.4)", cursor:"pointer", fontSize:14 }}>✕</button>
          </div>
        )}
        <div style={{ display:"flex", gap:6, alignItems:"flex-end" }}>
          <button onClick={()=>fileRef.current?.click()} style={{ background:G+"0.05)", border:`1px solid ${G+"0.2)"}`, borderRadius:8, color:G+"0.7)", fontSize:14, width:34, height:34, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>📎</button>
          <input ref={fileRef} type="file" accept={ACCEPTED} style={{ display:"none" }} onChange={handleFile} />
          <button onClick={startVoice} style={{ background:listening?agent.accent:G+"0.05)", border:`1px solid ${listening?agent.accent:G+"0.2)"}`, borderRadius:8, color:listening?"#fff":G+"0.7)", fontSize:14, width:34, height:34, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all 0.15s" }}>🎤</button>
          <textarea value={input} onChange={e=>{setInput(e.target.value);inputRef.current=e.target.value;}} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} placeholder={agent.placeholder} rows={2}
            style={{ flex:1, background:G+"0.06)", border:`1px solid ${input||attached?agent.accent+"66":G+"0.12)"}`, borderRadius:10, color:G+"0.9)", fontSize:12, padding:"8px 11px", fontFamily:"'Courier New',monospace", resize:"none", outline:"none", lineHeight:1.6, transition:"border 0.2s" }} />
          <button onClick={send} disabled={loading||(!input.trim()&&!attached)}
            style={{ background:(loading||(!input.trim()&&!attached))?G+"0.05)":`linear-gradient(135deg,${agent.accent}cc,${agent.accent}88)`, border:`1px solid ${G+"0.15)"}`, borderRadius:10, color:(loading||(!input.trim()&&!attached))?G+"0.2)":"#fff", fontSize:17, width:38, height:38, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all 0.15s" }}>↑</button>
        </div>
        <div style={{ marginTop:5, fontSize:9, color:G+"0.2)", fontFamily:"'Courier New',monospace" }}>ENTER enviar · SHIFT+ENTER nueva línea</div>
      </div>
    </div>
  );
}

export default function App() {
  const [unlocked, setUnlocked] = useState(false);
  const [active, setActive] = useState(null);
  const isMobile = useIsMobile();
  useEffect(() => { try { if (sessionStorage.getItem("auth") === PASSWORD) setUnlocked(true); } catch(e) {} }, []);
  function unlock() { try { sessionStorage.setItem("auth", PASSWORD); } catch(e) {} setUnlocked(true); }
  if (!unlocked) return <PasswordGate onUnlock={unlock} />;

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#1a1a2e 0%,#16213e 40%,#0f3460 70%,#533483 100%)", padding:"18px 16px", fontFamily:"Georgia,serif" }}>
      <div style={{ textAlign:"center", marginBottom:24 }}>
        <div style={{ fontSize:9, letterSpacing:5, color:G+"0.35)", textTransform:"uppercase", marginBottom:5, fontFamily:"'Courier New',monospace" }}>IGNACIO SOTO · TRELEW, CHUBUT</div>
        <h1 style={{ margin:0, fontSize:isMobile?18:22, fontWeight:400, color:G+"0.95)", letterSpacing:3, textTransform:"uppercase" }}>Panel de Agentes</h1>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginTop:6 }}>
          <div style={{ height:"1px", width:60, background:`linear-gradient(90deg,transparent,${G+"0.2)"})` }} />
          <div style={{ fontSize:8, letterSpacing:3, color:G+"0.25)", fontFamily:"'Courier New',monospace" }}>SISTEMA DE INTELIGENCIA</div>
          <div style={{ height:"1px", width:60, background:`linear-gradient(90deg,${G+"0.2)"},transparent)` }} />
        </div>
      </div>

      <div style={{ display:"flex", flexDirection:isMobile?"column":"row", gap:12, justifyContent:"center", maxWidth:1100, margin:"0 auto 24px", padding:isMobile?"0 4px":"0" }}>
        {AGENTS.map(agent => {
          const isActive = active?.id === agent.id;
          return (
            <button key={agent.id} onClick={()=>setActive(isActive?null:agent)}
              style={{ flex:1, padding:isMobile?"10px 12px":"14px 16px", borderRadius:14, border:`1px solid ${isActive?"rgba(255,255,255,0.35)":"rgba(255,255,255,0.1)"}`, background:isActive?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.06)", cursor:"pointer", textAlign:"left", transition:"all 0.25s", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)", boxShadow:isActive?`0 8px 32px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.2)`:"0 4px 16px rgba(0,0,0,0.2),inset 0 1px 0 rgba(255,255,255,0.05)", transform:isActive?"translateY(-2px)":"translateY(0)" }}>
              <div style={{ fontSize:24, marginBottom:6 }}>{agent.icon}</div>
              <div style={{ fontSize:8.5, letterSpacing:2.5, color:isActive?G+"0.8)":G+"0.35)", textTransform:"uppercase", fontFamily:"'Courier New',monospace", marginBottom:3 }}>{agent.tag}</div>
              <div style={{ fontSize:12.5, color:isActive?G+"0.95)":G+"0.55)", fontFamily:"'Courier New',monospace" }}>{agent.label}</div>
              <div style={{ marginTop:8, fontSize:9, color:isActive?G+"0.45)":G+"0.2)", fontFamily:"'Courier New',monospace" }}>{isActive?"▼ activo":"→ seleccionar"}</div>
            </button>
          );
        })}
      </div>

      {active && (
        <div style={{ maxWidth:1100, margin:"0 auto", background:"rgba(255,255,255,0.08)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", border:"1px solid rgba(255,255,255,0.18)", borderRadius:18, padding:isMobile?12:20, boxShadow:"0 8px 48px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.15)", display:"flex", flexDirection:"column", minHeight:isMobile?500:680 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, paddingBottom:14, borderBottom:"1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:38, height:38, borderRadius:10, background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>{active.icon}</div>
              <div>
                <div style={{ fontSize:9, letterSpacing:2.5, color:active.accent, textTransform:"uppercase", fontFamily:"'Courier New',monospace" }}>{active.tag}</div>
                <div style={{ fontSize:15, color:G+"0.95)", fontFamily:"'Courier New',monospace" }}>{active.label}</div>
              </div>
            </div>
            <button onClick={()=>setActive(null)} style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:8, color:G+"0.5)", fontSize:11, padding:"5px 14px", cursor:"pointer", fontFamily:"'Courier New',monospace" }}>✕ cerrar</button>
          </div>
          <div style={{ display:"flex", flexDirection:isMobile?"column":"row", gap:16, flex:1, minHeight:0 }}>
            <div style={{ width:isMobile?"100%":340, flexShrink:0, overflowY:"auto", maxHeight:isMobile?280:undefined }}>
              <SummaryPanel agent={active} />
            </div>
            <div style={{ flex:1, display:"flex", flexDirection:"column", minHeight:0 }}>
              <ChatPanel agent={active} />
            </div>
          </div>
        </div>
      )}

      {!active && (
        <div style={{ textAlign:"center", marginTop:20, opacity:0.2 }}>
          <div style={{ fontSize:10, letterSpacing:3, color:G+"0.5)", fontFamily:"'Courier New',monospace" }}>SELECCIONÁ UN AGENTE PARA COMENZAR</div>
        </div>
      )}
      <div style={{ textAlign:"center", marginTop:20, fontSize:8.5, color:G+"0.15)", letterSpacing:2, fontFamily:"'Courier New',monospace" }}>🌐 BÚSQUEDA WEB · 📎 ARCHIVOS · 🎤 VOZ</div>
    </div>
  );
}
