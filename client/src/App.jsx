import { useState, useRef, useEffect } from "react";
import { Renderer, Program, Mesh, Triangle } from "ogl";
import "./App.css";

// ─── Grainient Background ────────────────────────────────────────────────────
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [1, 1, 1];
  return [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255];
};

const vertex = `#version 300 es
in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }`;

const fragment = `#version 300 es
precision highp float;
uniform vec2 iResolution;uniform float iTime;uniform float uTimeSpeed;uniform float uColorBalance;
uniform float uWarpStrength;uniform float uWarpFrequency;uniform float uWarpSpeed;uniform float uWarpAmplitude;
uniform float uBlendAngle;uniform float uBlendSoftness;uniform float uRotationAmount;uniform float uNoiseScale;
uniform float uGrainAmount;uniform float uGrainScale;uniform float uGrainAnimated;uniform float uContrast;
uniform float uGamma;uniform float uSaturation;uniform vec2 uCenterOffset;uniform float uZoom;
uniform vec3 uColor1;uniform vec3 uColor2;uniform vec3 uColor3;
out vec4 fragColor;
mat2 Rot(float a){float s=sin(a),c=cos(a);return mat2(c,-s,s,c);}
vec2 hash(vec2 p){p=vec2(dot(p,vec2(2127.1,81.17)),dot(p,vec2(1269.5,283.37)));return fract(sin(p)*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);float n=mix(mix(dot(-1.0+2.0*hash(i+vec2(0,0)),f-vec2(0,0)),dot(-1.0+2.0*hash(i+vec2(1,0)),f-vec2(1,0)),u.x),mix(dot(-1.0+2.0*hash(i+vec2(0,1)),f-vec2(0,1)),dot(-1.0+2.0*hash(i+vec2(1,1)),f-vec2(1,1)),u.x),u.y);return 0.5+0.5*n;}
void mainImage(out vec4 o,vec2 C){
  float t=iTime*uTimeSpeed;vec2 uv=C/iResolution.xy;float ratio=iResolution.x/iResolution.y;
  vec2 tuv=uv-0.5+uCenterOffset;tuv/=max(uZoom,0.001);
  float degree=noise(vec2(t*0.1,tuv.x*tuv.y)*uNoiseScale);
  tuv.y*=1.0/ratio;tuv*=Rot(radians((degree-0.5)*uRotationAmount+180.0));tuv.y*=ratio;
  float amplitude=uWarpAmplitude/max(uWarpStrength,0.001);float wt=t*uWarpSpeed;
  tuv.x+=sin(tuv.y*uWarpFrequency+wt)/amplitude;tuv.y+=sin(tuv.x*(uWarpFrequency*1.5)+wt)/(amplitude*0.5);
  float b=uColorBalance;float s=max(uBlendSoftness,0.0);
  mat2 br=Rot(radians(uBlendAngle));float bx=(tuv*br).x;
  vec3 l1=mix(uColor3,uColor2,smoothstep(-0.3-b-s,0.2-b+s,bx));
  vec3 l2=mix(uColor2,uColor1,smoothstep(-0.3-b-s,0.2-b+s,bx));
  vec3 col=mix(l1,l2,smoothstep(0.5-b+s,-0.3-b-s,tuv.y));
  vec2 gu=uv*max(uGrainScale,0.001);if(uGrainAnimated>0.5){gu+=vec2(iTime*0.05);}
  float grain=fract(sin(dot(gu,vec2(12.9898,78.233)))*43758.5453);col+=(grain-0.5)*uGrainAmount;
  col=(col-0.5)*uContrast+0.5;float luma=dot(col,vec3(0.2126,0.7152,0.0722));
  col=mix(vec3(luma),col,uSaturation);col=pow(max(col,0.0),vec3(1.0/max(uGamma,0.001)));
  o=vec4(clamp(col,0.0,1.0),1.0);
}
void main(){vec4 o=vec4(0);mainImage(o,gl_FragCoord.xy);fragColor=o;}`;

function GrainientBg() {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const renderer = new Renderer({ webgl: 2, alpha: true, antialias: false, dpr: Math.min(window.devicePixelRatio || 1, 2) });
    const gl = renderer.gl;
    const canvas = gl.canvas;
    Object.assign(canvas.style, { position: "absolute", inset: "0", width: "100%", height: "100%", display: "block" });
    ref.current.appendChild(canvas);
    const geo = new Triangle(gl);
    const prog = new Program(gl, {
      vertex, fragment,
      uniforms: {
        iTime: { value: 0 }, iResolution: { value: new Float32Array([1, 1]) },
        uTimeSpeed: { value: 0.15 }, uColorBalance: { value: 0.0 },
        uWarpStrength: { value: 1.0 }, uWarpFrequency: { value: 4.0 }, uWarpSpeed: { value: 1.2 }, uWarpAmplitude: { value: 65.0 },
        uBlendAngle: { value: 30.0 }, uBlendSoftness: { value: 0.1 }, uRotationAmount: { value: 380.0 }, uNoiseScale: { value: 2.2 },
        uGrainAmount: { value: 0.055 }, uGrainScale: { value: 2.5 }, uGrainAnimated: { value: 1.0 },
        uContrast: { value: 1.25 }, uGamma: { value: 1.05 }, uSaturation: { value: 0.8 },
        uCenterOffset: { value: new Float32Array([0, 0]) }, uZoom: { value: 0.88 },
        uColor1: { value: new Float32Array(hexToRgb("#8BA0D8")) },
        uColor2: { value: new Float32Array(hexToRgb("#374B8C")) },
        uColor3: { value: new Float32Array(hexToRgb("#080E20")) },
      }
    });
    const mesh = new Mesh(gl, { geometry: geo, program: prog });
    const setSize = () => {
      const r = ref.current.getBoundingClientRect();
      renderer.setSize(Math.max(1, Math.floor(r.width)), Math.max(1, Math.floor(r.height)));
      prog.uniforms.iResolution.value[0] = gl.drawingBufferWidth;
      prog.uniforms.iResolution.value[1] = gl.drawingBufferHeight;
    };
    const ro = new ResizeObserver(setSize); ro.observe(ref.current); setSize();
    let raf = 0; const t0 = performance.now();
    const loop = (t) => { prog.uniforms.iTime.value = (t - t0) * 0.001; renderer.render({ scene: mesh }); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); try { ref.current?.removeChild(canvas); } catch {} };
  }, []);
  return <div ref={ref} style={{ position: "fixed", inset: 0, zIndex: 0 }} />;
}

// ─── Components ───────────────────────────────────────────────────────────────
function SourceBadge({ source }) {
  return (
    <span className="source-badge">
      <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      {source.source}{source.page && <span className="source-page">· p{source.page}</span>}
    </span>
  );
}

function ConflictAlert({ conflicts }) {
  if (!conflicts?.length) return null;
  return (
    <div className="conflict-alert">
      <div className="conflict-head">
        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
        Conflict detected
      </div>
      {conflicts.map((c, i) => <p key={i}>{c}</p>)}
    </div>
  );
}

function CRMTicket({ ticket }) {
  const [open, setOpen] = useState(false);
  if (!ticket) return null;
  return (
    <div className="crm-card">
      <button onClick={() => setOpen(!open)} className="crm-toggle">
        <span>
          <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
          CRM Ticket · {ticket.id}
        </span>
        <svg className={open ? "rot" : ""} width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="crm-body">
          <div className="crm-row"><span>Status</span><span className="crm-chip">{ticket.status}</span></div>
          <div className="crm-row"><span>Created</span><span>{new Date(ticket.createdAt).toLocaleString()}</span></div>
          <div className="crm-row"><span>Conflict</span><span>{ticket.hasConflict ? "Yes" : "No"}</span></div>
          <div><p className="crm-label">Summary</p><p>{ticket.summary}</p></div>
        </div>
      )}
    </div>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={`msg-row ${isUser ? "msg-u" : "msg-a"}`}>
      {!isUser && (
        <div className="ai-avatar">
          <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      )}
      <div className="msg-wrap">
        <div className={`bubble ${isUser ? "bubble-u" : "bubble-a"}`}>{message.content}</div>
        {!isUser && message.sources?.length > 0 && (
          <div className="sources">
            {message.sources.filter((s, i, a) => a.findIndex(x => x.source === s.source && x.page === s.page) === i).map((s, i) => <SourceBadge key={i} source={s} />)}
          </div>
        )}
        {!isUser && <ConflictAlert conflicts={message.conflicts} />}
        {!isUser && <CRMTicket ticket={message.crmTicket} />}
      </div>
      {isUser && <div className="user-avatar">U</div>}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="msg-row msg-a">
      <div className="ai-avatar">
        <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <div className="bubble bubble-a typing">
        <span className="dot" style={{ animationDelay: "0ms" }} />
        <span className="dot" style={{ animationDelay: "160ms" }} />
        <span className="dot" style={{ animationDelay: "320ms" }} />
      </div>
    </div>
  );
}

function PinUpload() {
  const [uploading, setUploading] = useState(false);
  const [showToast, setShowToast] = useState(null);
  const inputRef = useRef(null);

  async function uploadFile(file) {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("http://localhost:5000/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setShowToast({ ok: true, msg: `${data.file} · ${data.chunks} chunks ingested` });
    } catch (err) {
      setShowToast({ ok: false, msg: err.message });
    } finally {
      setUploading(false);
      setTimeout(() => setShowToast(null), 3500);
    }
  }

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button
        className={`pin-btn ${uploading ? "pin-loading" : ""}`}
        onClick={() => inputRef.current?.click()}
        title="Attach document"
        onDragOver={(e) => { e.preventDefault(); }}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) uploadFile(f); }}
      >
        <input ref={inputRef} type="file" accept=".pdf,.xlsx,.xls,.eml,.txt" style={{ display: "none" }} onChange={(e) => { const f = e.target.files[0]; if (f) uploadFile(f); }} />
        {uploading ? (
          <svg className="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
          </svg>
        )}
      </button>
      {showToast && (
        <div className={`toast ${showToast.ok ? "toast-ok" : "toast-err"}`}>
          {showToast.ok ? "✓" : "✗"} {showToast.msg}
        </div>
      )}
    </div>
  );
}

function ChatInput({ onSend, loading }) {
  const [value, setValue] = useState("");
  const submit = () => { if (!value.trim() || loading) return; onSend(value.trim()); setValue(""); };
  return (
    <div className="input-bar">
      <PinUpload />
      <textarea
        className="chat-input"
        placeholder="Ask anything about your documents…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
        rows={1}
        disabled={loading}
      />
      <button onClick={submit} disabled={!value.trim() || loading} className="send-btn">
        <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </button>
    </div>
  );
}

function Sidebar({ onSuggest }) {
  const suggestions = [
    "What is the story about?",
    "What is the price of Ignisia Pro Suite?",
    "Summarize the key findings",
    "Are there any conflicting details?",
  ];
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">
          <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <div className="brand-name">Ignisia</div>
          <div className="brand-sub">Document Intelligence</div>
        </div>
      </div>

      <div className="sidebar-section">
        <p className="section-label">Suggested Queries</p>
        {suggestions.map((q, i) => (
          <button key={i} onClick={() => onSuggest(q)} className="suggest-btn">
            <span className="suggest-icon">›</span>{q}
          </button>
        ))}
      </div>

      <div className="sidebar-footer">
        <span className="live-dot-sm" />
        Groq + LangGraph
      </div>
    </aside>
  );
}

const API_URL = "http://localhost:5000/api/chat";

export default function App() {
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: "Welcome. I'm your document intelligence assistant — powered by RAG. Upload files or ask me anything about your ingested documents.",
    sources: [], conflicts: [], crmTicket: null,
  }]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  async function sendMessage(question) {
    setMessages(prev => [...prev, { role: "user", content: question }]);
    setLoading(true);
    try {
      const res = await fetch(API_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question }) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessages(prev => [...prev, { role: "assistant", content: data.answer, sources: data.sources || [], conflicts: data.conflicts || [], crmTicket: data.crmTicket || null }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: `Error: ${err.message}`, sources: [], conflicts: [], crmTicket: null }]);
    } finally { setLoading(false); }
  }

  return (
    <>
      <GrainientBg />
      <div className="app">
        <Sidebar onSuggest={sendMessage} />
        <div className="chat-panel">
          <header className="chat-header">
            <div>
              <h1 className="header-title">Document Chat</h1>
              <p className="header-sub">Query across all ingested documents</p>
            </div>
            <span className="live-badge"><span className="live-dot" />Live</span>
          </header>
          <div className="messages">
            {messages.map((msg, i) => <MessageBubble key={i} message={msg} />)}
            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>
          <div className="input-area">
            <ChatInput onSend={sendMessage} loading={loading} />
          </div>
        </div>
      </div>
    </>
  );
}
