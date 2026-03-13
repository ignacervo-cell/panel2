import { useState, useRef, useEffect } from "react";

const PASSWORD = "trelew2026";

const SYSTEM_JUDICIAL = `Sos un experto en comunicación judicial argentina con acceso a búsqueda web.
Analizás documentos judiciales y generás el Doble Producto COMPLETO.
Al final de tu respuesta siempre incluí la nota de prensa entre estos marcadores exactos:
===NOTA_PRENSA_INICIO===
(aquí va SOLO el texto de la nota de prensa, lista para publicar)
===NOTA_PRENSA_FIN===
1. FICHA TÉCNICA (Uso Interno)
- Datos Duros: Expediente, fecha exacta, montos, dominios de vehículos.
- Intervinientes: Jueces/Juezas, Fiscales y Defensores (primer nombre y apellido).
- Cronología: Hecho → Primera Instancia → Segunda Instancia.
2. NOTA DE PRENSA
- Lenguaje claro, enfoque institucional, cifras redondeadas.
- Anonimizar si hay menores, familia o delitos sexuales.
- Incluir citas textuales clave. Mencionar ciudad al inicio.
- Prohibido inventar. Sin consejos.`;

const SYSTEM_LIBRE = `Sos Claude, asistente general con acceso a búsqueda web. Podés analizar PDFs, imágenes y documentos. El usuario es Ignacio Soto, abogado de Trelew, Chubut, Argentina. Respondé en español. Sé directo y útil.`;

const SYSTEM_FINANCIERO = `Sos un asesor financiero argentino experto con acceso a búsqueda web en tiempo real. Buscás datos actuales de dólar blue, oficial, MEP, tasas bancarias y mercados. Respondé siempre con datos reales del día, sé directo y concreto. El usuario es Ignacio Soto de Trelew, Chubut.`;

const AGENTS = [
  { id:"judicial", label:"Agente Judicial", icon:"⚖️", tag:"COMUNICACIÓN JUDICIAL", accent:"#2563eb", accentDim:"rgba(37,99,235,0.12)", accentBorder:"rgba(37,99,235,0.35)", system:SYSTEM_JUDICIAL, diarioApi:"/api/judicial-diario", placeholder:"Adjuntá un fallo o pegá texto para generar ficha + nota..." },
  { id:"libre", label:"Agente Libre", icon:"🤖", tag:"ASISTENTE GENERAL", accent:"#7c3aed", accentDim:"rgba(124,58,237,0.12)", accentBorder:"rgba(124,58,237,0.35)", system:SYSTEM_LIBRE, diarioApi:"/api/libre-diario", placeholder:"Preguntá cualquier cosa, adjuntá archivos..." },
  { id:"financiero", label:"Agente Financiero", icon:"📈", tag:"ASESOR FINANCIERO", accent:"#059669", accentDim:"rgba(5,150,105,0.12)", accentBorder:"rgba(5,150,105,0.35)", system:SYSTEM_FINANCIERO, diarioApi:"/api/financiero", placeholder:"Consultá sobre dólar, inversiones, tasas..." },
];

const ACCEPTED = ".pdf,.jpg,.jpeg,.png,.gif,.webp,.txt";

function getText(c) { if(typeof c==="string") return c; if(Array.isArray(c)) return c.filter(b=>b.type==="text").map(b=>b.text).join(""); return ""; }
function fileToBase64(f) { return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result.split(",")[1]); r.onerror=()=>rej(new Error("Error")); r.readAsDataURL(f); }); }
function getMediaType(f) { if(f.type) return f.type; const e=f.name.split(".").pop().toLowerCase(); return {pdf:"application/pdf",jpg:"image/jpeg",jpeg:"image/jpeg",png:"image/png",gif:"image/gif",webp:"image/webp",txt:"text/plain"}[e]||"application/octet-stream"; }
function extractNota(t) { const m=t.match(/===NOTA_PRENSA_INICIO===([\s\S]*?)===NOTA_PRENSA_FIN===/); return m?m[1].trim():null; }
function cleanText(t) { return t.replace(/===NOTA_PRENSA_INICIO===[\s\S]*?===NOTA_PRENSA_FIN===/g,"").trim(); }
function uid() { return Math.random().toString(36).substr(2,9)+Date.now().toString(36); }

function TypingDots({color}) {
  return <span style={{display:"inline-flex",gap:4,alignItems:"center"}}>{[0,1,2].map(i=><span key={i} style={{width:6,height:6,borderRadius:"50%",background:color,display:"inline-block",animation:`dot 1.2s ${i*0.18}s infinite ease-in-out`}}/>)}<style>{`@keyframes dot{0%,80%,100%{transform:scale(0.5);opacity:0.3}40%{transform:scale(1);opacity:1}}`}</style></span>;
}

function PasswordGate({onUnlock}) {
  const [val,setVal]=useState(""); const [err,setErr]=useState(false); const [show,setShow]=useState(false);
  function check() { if(val===PASSWORD){onUnlock();}else{setErr(true);setVal("");setTimeout(()=>setErr(false),1500);} }
  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#050d1f,#0d1b3e,#130a2e)",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:52,marginBottom:12}}>⚖️</div>
        <div style={{fontSize:10,letterSpacing:5,color:"#3a5a9a",textTransform:"uppercase",marginBottom:6,fontFamily:"'Courier New',monospace"}}>ACCESO RESTRINGIDO</div>
        <h1 style={{margin:"0 0 28px",fontSize:20,fontWeight:400,color:"#c8d4f0",letterSpacing:2,fontFamily:"Georgia,serif"}}>Panel de Agentes</h1>
        <div style={{position:"relative",display:"inline-flex",alignItems:"center"}}>
          <input type={show?"text":"password"} value={val} onChange={e=>setVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&check()} placeholder="Contraseña" autoFocus
            style={{background:"rgba(255,255,255,0.06)",border:`1.5px solid ${err?"#ef4444":"rgba(255,255,255,0.15)"}`,borderRadius:12,color:"#e0e8ff",fontSize:14,padding:"12px 44px 12px 16px",width:220,outline:"none",fontFamily:"'Courier New',monospace"}}/>
          <button onClick={()=>setShow(!show)} style={{position:"absolute",right:12,background:"none",border:"none",color:"#5a7aaa",cursor:"pointer",fontSize:14}}>{show?"🙈":"👁️"}</button>
        </div>
        <div style={{marginTop:14}}>
          <button onClick={check} style={{background:"linear-gradient(135deg,#2563eb,#1d4ed8)",border:"none",borderRadius:10,color:"#fff",fontSize:13,padding:"11px 32px",cursor:"pointer",fontFamily:"Georgia,serif"}}>Ingresar →</button>
        </div>
        {err&&<div style={{marginTop:10,fontSize:12,color:"#f87171",fontFamily:"'Courier New',monospace"}}>Contraseña incorrecta</div>}
      </div>
    </div>
  );
}

function SummaryPanel({agent}) {
  const [data,setData]=useState(null); const [loading,setLoading]=useState(false); const [init,setInit]=useState(false);
  useEffect(()=>{ fetch(agent.diarioApi).then(r=>r.json()).then(d=>{setData(d);setInit(true);}).catch(()=>setInit(true)); },[agent.id]);
  async function refresh() { setLoading(true); await fetch(agent.diarioApi,{method:"POST"}).catch(()=>{}); const d=await fetch(agent.diarioApi).then(r=>r.json()).catch(()=>({})); setData(d); setLoading(false); }
  return (
    <div style={{background:"rgba(0,0,0,0.25)",border:`1px solid ${agent.accentBorder}`,borderRadius:10,marginBottom:14,overflow:"hidden"}}>
      <div style={{padding:"7px 12px",borderBottom:`1px solid ${agent.accentBorder}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:9.5,letterSpacing:1.5,color:agent.accent,fontFamily:"'Courier New',monospace"}}>{data?.fecha?`📅 ${data.fecha}`:"RESUMEN DIARIO"}</div>
        <button onClick={refresh} disabled={loading} style={{background:agent.accentDim,border:`1px solid ${agent.accentBorder}`,borderRadius:6,color:agent.accent,fontSize:9.5,padding:"3px 10px",cursor:"pointer",fontFamily:"'Courier New',monospace"}}>{loading?"...":"↻ Act."}</button>
      </div>
      <div style={{padding:"10px 12px",maxHeight:260,overflowY:"auto"}}>
        {!init?<div style={{color:"#2a3a5a",fontSize:11,fontFamily:"'Courier New',monospace"}}>Cargando...</div>
        :data?.texto?<div style={{fontSize:11.5,color:"#b0bcd8",lineHeight:1.85,whiteSpace:"pre-wrap",fontFamily:"'Courier New',monospace"}}>{data.texto}</div>
        :<div style={{textAlign:"center",padding:"14px 0"}}>
          <div style={{fontSize:10,color:"#3a4a6a",fontFamily:"'Courier New',monospace",marginBottom:8}}>Sin datos del día</div>
          <button onClick={refresh} disabled={loading} style={{background:`linear-gradient(135deg,${agent.accent},${agent.accent}cc)`,border:"none",borderRadius:7,color:"#fff",fontSize:10,padding:"7px 18px",cursor:"pointer",fontFamily:"'Courier New',monospace"}}>{loading?"Generando...":"▶ Generar"}</button>
        </div>}
      </div>
    </div>
  );
}

function ChatPanel({agent}) {
  const [messages,setMessages]=useState([]); const [input,setInput]=useState(""); const [loading,setLoading]=useState(false); const [status,setStatus]=useState(""); const [attached,setAttached]=useState(null); const [listening,setListening]=useState(false);
  const fileRef=useRef(null); const bottomRef=useRef(null);
  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[messages,loading]);

  function startVoice() {
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition; if(!SR) return;
    const rec=new SR(); rec.lang="es-AR"; rec.continuous=false; rec.interimResults=false;
    rec.onresult=e=>{setInput(p=>p+e.results[0][0].transcript);setListening(false);}; rec.onerror=()=>setListening(false); rec.onend=()=>setListening(false);
    rec.start(); setListening(true);
  }

  async function handleFile(e) { const f=e.target.files[0]; if(!f) return; const b=await fileToBase64(f); setAttached({name:f.name,base64:b,mediaType:getMediaType(f)}); e.target.value=""; }

  function buildContent(text,file) {
    if(!file) return text;
    const parts=[];
    if(file.mediaType==="application/pdf") parts.push({type:"document",source:{type:"base64",media_type:"application/pdf",data:file.base64}});
    else if(file.mediaType.startsWith("image/")) parts.push({type:"image",source:{type:"base64",media_type:file.mediaType,data:file.base64}});
    parts.push({type:"text",text:text||"Analizá este archivo."}); return parts;
  }

  async function send() {
    const text=input.trim(); if((!text&&!attached)||loading) return;
    const display=attached?`📎 ${attached.name}${text?"\n"+text:""}`:text;
    const userMsg={role:"user",content:buildContent(text,attached),display};
    const hist=[...messages,userMsg];
    setMessages(hist); setInput(""); setAttached(null); setLoading(true); setStatus("");
    try {
      let convo=hist.map(m=>({role:m.role,content:m.content}));
      while(true) {
        const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:4096,system:agent.system,tools:[{type:"web_search_20250305",name:"web_search"}],messages:convo})});
        const data=await res.json();
        if(!data.content) throw new Error(data.error||"Sin respuesta");
        convo=[...convo,{role:"assistant",content:data.content}];
        if(data.stop_reason==="end_turn") {
          const full=getText(data.content);
          let notaTexto=agent.id==="judicial"?extractNota(full):null;
          if(agent.id==="judicial"&&!notaTexto) {
            setStatus("📰 Extrayendo nota...");
            try { const r2=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:2048,system:"Escribí SOLO la nota de prensa del fallo analizado, lista para publicar.",messages:[...convo,{role:"user",content:"Escribí la nota de prensa completa."}]})}); const d2=await r2.json(); notaTexto=getText(d2.content)||null; } catch(e) {}
          }
          const clean=cleanText(full); let notaId=null;
          if(notaTexto){notaId=uid();try{sessionStorage.setItem("nota_"+notaId,JSON.stringify({texto:notaTexto,fecha:new Date().toLocaleDateString("es-AR",{day:"numeric",month:"long",year:"numeric"})}))}catch(e){}}
          setMessages([...hist,{role:"assistant",content:clean,display:clean,notaId}]); break;
        }
        if(data.stop_reason==="tool_use") { setStatus("🔍 Buscando..."); const results=data.content.filter(b=>b.type==="tool_use").map(b=>({type:"tool_result",tool_use_id:b.id,content:"búsqueda completada"})); convo=[...convo,{role:"user",content:results}]; continue; }
        const fb=getText(data.content); if(fb) setMessages([...hist,{role:"assistant",content:fb,display:fb}]); break;
      }
    } catch(err) { setMessages([...hist,{role:"assistant",content:`Error: ${err.message}`,display:`Error: ${err.message}`}]); }
    finally { setLoading(false); setStatus(""); }
  }

  return (
    <div style={{display:"flex",flexDirection:"column",flex:1,minHeight:0}}>
      <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:8,paddingBottom:8,minHeight:120}}>
        {messages.length===0&&<div style={{textAlign:"center",marginTop:40,opacity:0.3}}><div style={{fontSize:28,marginBottom:6}}>{agent.icon}</div><div style={{fontSize:11,color:"#3a4a6a",fontFamily:"'Courier New',monospace"}}>Listo para trabajar</div></div>}
        {messages.map((m,i)=>{
          const isUser=m.role==="user"; const text=m.display||getText(m.content); if(!text) return null;
          return (<div key={i} style={{display:"flex",flexDirection:"column",alignItems:isUser?"flex-end":"flex-start"}}>
            <div style={{maxWidth:"88%",padding:"9px 13px",borderRadius:isUser?"14px 14px 3px 14px":"3px 14px 14px 14px",background:isUser?`linear-gradient(135deg,${agent.accent},${agent.accent}cc)`:"rgba(255,255,255,0.06)",color:isUser?"#fff":"#c0cce0",fontSize:12.5,lineHeight:1.75,whiteSpace:"pre-wrap",wordBreak:"break-word",fontFamily:"'Courier New',monospace"}}>{text}</div>
            {m.notaId&&<button onClick={()=>window.open(`/nota?id=${m.notaId}`,"_blank")} style={{marginTop:5,background:agent.accentDim,border:`1px solid ${agent.accentBorder}`,borderRadius:6,color:agent.accent,fontSize:10,padding:"4px 12px",cursor:"pointer",fontFamily:"'Courier New',monospace"}}>🔗 Ver Nota de Prensa</button>}
          </div>);
        })}
        {loading&&<div style={{display:"flex"}}><div style={{padding:"8px 13px",background:"rgba(255,255,255,0.05)",borderRadius:"3px 14px 14px 14px",display:"flex",flexDirection:"column",gap:4}}>{status&&<div style={{fontSize:10,color:"#4a5a7a",fontFamily:"'Courier New',monospace"}}>{status}</div>}<TypingDots color={agent.accent}/></div></div>}
        <div ref={bottomRef}/>
      </div>
      <div style={{borderTop:`1px solid ${agent.accentBorder}`,paddingTop:10,marginTop:4,flexShrink:0}}>
        {attached&&<div style={{display:"flex",alignItems:"center",gap:6,marginBottom:7,padding:"5px 10px",background:agent.accentDim,borderRadius:7,border:`1px solid ${agent.accentBorder}`}}><span style={{fontSize:12}}>{attached.mediaType.startsWith("image/")?"🖼️":"📄"}</span><span style={{fontSize:10,color:agent.accent,flex:1,fontFamily:"'Courier New',monospace",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{attached.name}</span><button onClick={()=>setAttached(null)} style={{background:"none",border:"none",color:"#6a7a9a",cursor:"pointer",fontSize:14}}>✕</button></div>}
        <div style={{display:"flex",gap:6,alignItems:"flex-end"}}>
          <button onClick={()=>fileRef.current?.click()} style={{background:"none",border:`1px solid ${agent.accentBorder}`,borderRadius:8,color:agent.accent,fontSize:14,width:34,height:34,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>📎</button>
          <input ref={fileRef} type="file" accept={ACCEPTED} style={{display:"none"}} onChange={handleFile}/>
          <button onClick={startVoice} style={{background:listening?agent.accent:"none",border:`1px solid ${agent.accentBorder}`,borderRadius:8,color:listening?"#fff":agent.accent,fontSize:14,width:34,height:34,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.15s"}}>🎤</button>
          <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} placeholder={agent.placeholder} rows={2}
            style={{flex:1,background:"rgba(255,255,255,0.04)",border:`1px solid ${input||attached?agent.accent+"66":agent.accentBorder}`,borderRadius:10,color:"#d0d8f0",fontSize:12,padding:"8px 11px",fontFamily:"'Courier New',monospace",resize:"none",outline:"none",lineHeight:1.6,transition:"border 0.2s"}}/>
          <button onClick={send} disabled={loading||(!input.trim()&&!attached)} style={{background:(loading||(!input.trim()&&!attached))?"rgba(255,255,255,0.04)":`linear-gradient(135deg,${agent.accent},${agent.accent}cc)`,border:"none",borderRadius:10,color:(loading||(!input.trim()&&!attached))?"#3a4a6a":"#fff",fontSize:17,width:38,height:38,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.15s"}}>↑</button>
        </div>
        <div style={{marginTop:5,fontSize:9,color:"#1a2a4a",fontFamily:"'Courier New',monospace"}}>ENTER enviar · SHIFT+ENTER nueva línea</div>
      </div>
    </div>
  );
}

export default function App() {
  const [unlocked,setUnlocked]=useState(false);
  const [active,setActive]=useState(null);
  useEffect(()=>{ try{if(sessionStorage.getItem("auth")===PASSWORD) setUnlocked(true);}catch(e){} },[]);
  function unlock(){try{sessionStorage.setItem("auth",PASSWORD);}catch(e){}setUnlocked(true);}
  if(!unlocked) return <PasswordGate onUnlock={unlock}/>;

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#050d1f 0%,#0a1530 50%,#0d0820 100%)",padding:"18px 16px",fontFamily:"Georgia,serif"}}>
      {/* Header */}
      <div style={{textAlign:"center",marginBottom:24}}>
        <div style={{fontSize:9,letterSpacing:5,color:"#1e3a6a",textTransform:"uppercase",marginBottom:5,fontFamily:"'Courier New',monospace"}}>IGNACIO SOTO · TRELEW, CHUBUT</div>
        <h1 style={{margin:0,fontSize:22,fontWeight:400,color:"#c0cce8",letterSpacing:3,textTransform:"uppercase"}}>Panel de Agentes</h1>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginTop:6}}>
          <div style={{height:"1px",width:60,background:"linear-gradient(90deg,transparent,#1e3a6a)"}}/>
          <div style={{fontSize:8,letterSpacing:3,color:"#1e3a6a",fontFamily:"'Courier New',monospace"}}>SISTEMA DE INTELIGENCIA</div>
          <div style={{height:"1px",width:60,background:"linear-gradient(90deg,#1e3a6a,transparent)"}}/>
        </div>
      </div>

      {/* Cards selector — always visible at top */}
      <div style={{display:"flex",gap:12,justifyContent:"center",marginBottom:24,maxWidth:900,margin:"0 auto 24px"}}>
        {AGENTS.map(agent=>{
          const isActive=active?.id===agent.id;
          return (
            <button key={agent.id} onClick={()=>setActive(isActive?null:agent)}
              style={{flex:1,padding:"14px 16px",borderRadius:14,border:`1.5px solid ${isActive?agent.accent:agent.accentBorder}`,background:isActive?agent.accentDim:"rgba(6,12,32,0.7)",cursor:"pointer",textAlign:"left",transition:"all 0.2s",boxShadow:isActive?`0 0 20px ${agent.accent}33`:"none",transform:isActive?"translateY(-2px)":"translateY(0)"}}>
              <div style={{fontSize:24,marginBottom:6}}>{agent.icon}</div>
              <div style={{fontSize:8.5,letterSpacing:2.5,color:isActive?agent.accent:"#3a4a6a",textTransform:"uppercase",fontFamily:"'Courier New',monospace",marginBottom:3}}>{agent.tag}</div>
              <div style={{fontSize:12.5,color:isActive?"#e0e8ff":"#5a6a8a",fontFamily:"'Courier New',monospace"}}>{agent.label}</div>
              <div style={{marginTop:8,fontSize:9,color:isActive?agent.accent+"99":"#2a3a5a",fontFamily:"'Courier New',monospace"}}>{isActive?"▼ activo":"→ seleccionar"}</div>
            </button>
          );
        })}
      </div>

      {/* Main panel — expands when agent selected */}
      {active && (
        <div style={{maxWidth:900,margin:"0 auto",background:"rgba(6,12,32,0.9)",border:`1.5px solid ${active.accentBorder}`,borderRadius:18,padding:20,boxShadow:`0 8px 48px rgba(0,0,0,0.6), 0 0 40px ${active.accent}18`,display:"flex",flexDirection:"column",minHeight:600}}>
          {/* Panel header */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,paddingBottom:14,borderBottom:`1px solid ${active.accentBorder}`}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:38,height:38,borderRadius:10,background:active.accentDim,border:`1.5px solid ${active.accentBorder}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{active.icon}</div>
              <div>
                <div style={{fontSize:9,letterSpacing:2.5,color:active.accent,textTransform:"uppercase",fontFamily:"'Courier New',monospace"}}>{active.tag}</div>
                <div style={{fontSize:15,color:"#e0e8ff",fontFamily:"'Courier New',monospace"}}>{active.label}</div>
              </div>
            </div>
            <button onClick={()=>setActive(null)} style={{background:"none",border:`1px solid ${active.accentBorder}`,borderRadius:8,color:"#4a5a7a",fontSize:11,padding:"5px 14px",cursor:"pointer",fontFamily:"'Courier New',monospace"}}>✕ cerrar</button>
          </div>

          {/* Summary + Chat side by side */}
          <div style={{display:"flex",gap:16,flex:1,minHeight:0}}>
            {/* Summary left */}
            <div style={{width:340,flexShrink:0,overflowY:"auto"}}>
              <SummaryPanel agent={active}/>
            </div>
            {/* Chat right */}
            <div style={{flex:1,display:"flex",flexDirection:"column",minHeight:0}}>
              <ChatPanel agent={active}/>
            </div>
          </div>
        </div>
      )}

      {!active && (
        <div style={{textAlign:"center",marginTop:20,opacity:0.25}}>
          <div style={{fontSize:10,letterSpacing:3,color:"#2a3a5a",fontFamily:"'Courier New',monospace"}}>SELECCIONÁ UN AGENTE PARA COMENZAR</div>
        </div>
      )}

      <div style={{textAlign:"center",marginTop:20,fontSize:8.5,color:"#111a30",letterSpacing:2,fontFamily:"'Courier New',monospace"}}>🌐 BÚSQUEDA WEB · 📎 ARCHIVOS · 🎤 VOZ</div>
    </div>
  );
}
