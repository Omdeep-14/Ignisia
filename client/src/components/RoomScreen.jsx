import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { PinUpload } from "../App";

function IconBolt() {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function IconSparkles() {
  return (
    <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}
function IconWarn() {
  return (
    <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  );
}
function IconTicket() {
  return (
    <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  );
}

function AnalyzingBox({ conflicts, crmTicket, timeline, isPending }) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (isPending) {
      setPhase(0);
      const timers = [
        setTimeout(() => setPhase(1), 1500),
        setTimeout(() => setPhase(2), 3500),
        setTimeout(() => setPhase(3), 5500),
      ];
      return () => timers.forEach(clearTimeout);
    }
  }, [isPending]);

  const hasThoughts = (conflicts?.length > 0) || crmTicket || (timeline?.length > 0) || isPending;
  
  if (!hasThoughts) return null;

  const phases = ["Thinking...", "Analyzing documents...", "Retrieving context...", "Sorting conflicts..."];
  const title = isPending ? phases[phase] : "Analyzing the User's Request";

  return (
    <div className="analyzing-box" style={{ marginLeft: 'auto', marginRight: 'auto', maxWidth: '80%' }}>
      <button onClick={() => !isPending && setOpen(!open)} className="analyzing-toggle" style={{ cursor: isPending ? 'default' : 'pointer', opacity: isPending ? 0.8 : 1 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent)' }}>
          <IconSparkles /> {title}
        </span>
        <svg className={open ? "rot" : ""} width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="analyzing-content" style={{ textAlign: "left" }}>
          {conflicts?.length > 0 && (
            <div className="conflict-alert" style={{ marginBottom: crmTicket ? 12 : 0 }}>
              <div className="conflict-head"><IconWarn /> Conflict detected</div>
              {conflicts.map((c, i) => <p key={i}>{c}</p>)}
            </div>
          )}
          
          {crmTicket && (
            <div className="crm-card">
              <div className="crm-toggle" style={{ cursor: 'default' }}>
                <span><IconTicket /> CRM Ticket · {crmTicket.id}</span>
              </div>
              <div className="crm-body">
                <div className="crm-row"><span>Status</span><span className="crm-chip">{crmTicket.status}</span></div>
                <div className="crm-row"><span>Created</span><span>{new Date(crmTicket.createdAt).toLocaleString()}</span></div>
                <div className="crm-row"><span>Conflict</span><span>{crmTicket.hasConflict ? "Yes" : "No"}</span></div>
                <div><p className="crm-label">Summary</p><p>{crmTicket.summary}</p></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function RoomScreen({ room, session, profile, onLeave }) {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [members, setMembers] = useState([]);
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const bottomRef = useRef(null);
  const channelRef = useRef(null);

  const token = session.access_token;
  const headers = { Authorization: `Bearer ${token}` };
  const API = "http://localhost:5000";

  useEffect(() => {
    fetchMessages();
    setupRealtime();
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function fetchMessages() {
    const res = await fetch(`${API}/api/rooms/${room.id}/messages`, { headers });
    const data = await res.json();
    setMessages(data.messages ?? []);
  }

  function setupRealtime() {
    const channel = supabase.channel(`room:${room.id}`, {
      config: { presence: { key: session.user.id } },
    });
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      setMembers([...new Set(Object.values(state).flat().map(p => p.display_name))]);
    });
    channel.on("postgres_changes", { event: "INSERT", schema: "public", table: "room_messages", filter: `room_id=eq.${room.id}` },
      payload => setMessages(prev => prev.find(m => m.id === payload.new.id) ? prev : [...prev, payload.new])
    );
    channel.on("postgres_changes", { event: "UPDATE", schema: "public", table: "room_messages", filter: `room_id=eq.${room.id}` },
      payload => setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new : m))
    );
    channel.subscribe(async status => {
      if (status === "SUBSCRIBED") {
        await channel.track({ display_name: profile?.display_name ?? session.user.email });
      }
    });
    channelRef.current = channel;
  }

  async function sendQuestion() {
    if (!question.trim() || sending) return;
    setSending(true);
    const q = question.trim();
    setQuestion("");
    await fetch(`${API}/api/rooms/${room.id}/ask`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ question: q }),
    });
    setSending(false);
  }

  function copyCode() {
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Flatten messages so that a single DB row (with question + answer) 
  // becomes two distinct chat bubbles (User block, then AI block)
  const flattenedMessages = [];
  messages.forEach(msg => {
    // 1. User's question
    flattenedMessages.push({
      _id: msg.id + "-q",
      isAi: false,
      isOwnUser: msg.user_id === session.user.id,
      initials: msg.display_name?.[0]?.toUpperCase() ?? "?",
      name: msg.display_name ?? "Unknown",
      content: msg.question,
    });
    
    // 2. AI's answer (if requested/present)
    if (msg.is_pending || msg.answer) {
      flattenedMessages.push({
        _id: msg.id + "-a",
        isAi: true,
        // The user requested AI response should appear on the right 
        // alongside the sender. But typically AI response would only be 
        // right if it's the sender's own "assistant". Let's put AI on right.
        isOwnUser: true, 
        isPending: msg.is_pending,
        content: msg.answer,
        conflicts: msg.conflicts,
        crmTicket: msg.crmTicket,
        timeline: msg.timeline,
        sources: msg.sources
      });
    }
  });

  return (
    <div style={s.root}>
      {/* Sidebar */}
      <aside style={{ ...s.sidebar, width: sidebarCollapsed ? 0 : 240, opacity: sidebarCollapsed ? 0 : 1, overflow: "hidden", transition: "width 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.35s ease" }}>
        <div style={s.sidebarInner}>
          <button style={s.backBtn} onClick={onLeave}
            onMouseEnter={e => Object.assign(e.currentTarget.style, { color: "#f2f0eb", background: "#1e1e1e" })}
            onMouseLeave={e => Object.assign(e.currentTarget.style, { color: "#6b6963", background: "transparent" })}>
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to lobby
          </button>
          <div style={s.sidebarDivider} />
          <div style={s.sidebarLabel}>Room</div>
          <div style={s.roomNameSidebar}>{room.name}</div>
          <div style={s.codeCard} onClick={copyCode}
            onMouseEnter={e => Object.assign(e.currentTarget.style, { borderColor: "rgba(217,119,87,0.4)", background: "rgba(217,119,87,0.08)" })}
            onMouseLeave={e => Object.assign(e.currentTarget.style, { borderColor: "rgba(217,119,87,0.18)", background: "rgba(217,119,87,0.04)" })}>
            <div style={s.codeLabel}>Invite code · click to copy</div>
            <div style={s.codeValue}>{room.code}</div>
            <div style={s.codeCopied}>{copied ? "✓ Copied!" : ""}</div>
          </div>
          <div style={s.sidebarLabel}>Online</div>
          <div style={s.membersList}>
            {members.length === 0 ? (
              <div style={s.memberEmpty}>Just you</div>
            ) : (
              members.map(name => (
                <div key={name} style={s.memberItem}>
                  <span style={s.memberDot} />
                  <span style={s.memberName}>{name}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>

      <button style={{ ...s.floatToggle, ...(sidebarCollapsed ? {} : s.floatToggleHidden) }}
        onClick={() => setSidebarCollapsed(false)}>
        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Main */}
      <div style={s.main}>
        <header style={s.header}>
          <div style={s.headerLeft}>
            <button style={s.collapseHeaderBtn} onClick={() => setSidebarCollapsed(v => !v)}
              onMouseEnter={e => Object.assign(e.currentTarget.style, { background: "#1e1e1e", color: "#f2f0eb" })}
              onMouseLeave={e => Object.assign(e.currentTarget.style, { background: "transparent", color: "#6b6963" })}>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <div style={s.headerTitle}>{room.name}</div>
              <div style={s.headerSub}>Collaborative room · {members.length || 1} online</div>
            </div>
          </div>
          <div style={s.liveBadge}><span style={s.liveDot} /> Live</div>
        </header>

        <div style={s.messages}>
          {flattenedMessages.length === 0 && (
            <div style={s.emptyState}>
              <div style={s.emptyIcon}>
                <svg width="22" height="22" fill="none" stroke="#6b6963" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-3.49-.64L3 21l1.64-4.51A8.003 8.003 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p style={s.emptyTitle}>No questions yet</p>
              <p style={s.emptySub}>Start chatting! Start your message with @ai to query documents.</p>
            </div>
          )}
          
          {flattenedMessages.map((msg) => (
            <div key={msg._id} className={`msg-row ${msg.isOwnUser ? "msg-u" : "msg-a"}`}>
              {!msg.isOwnUser && !msg.isAi && (
                <div className="user-avatar-msg" style={{ background: "#242424" }}>{msg.initials}</div>
              )}
              {msg.isAi && !msg.isOwnUser && <div className="ai-avatar"><IconBolt /></div>}
              
              <div className="msg-wrap" style={{ alignItems: msg.isOwnUser ? "flex-end" : "flex-start" }}>
                
                {!msg.isOwnUser && !msg.isAi && (
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4, marginLeft: 2 }}>{msg.name}</div>
                )}
                
                {msg.isAi && (
                  <AnalyzingBox conflicts={msg.conflicts} crmTicket={msg.crmTicket} timeline={msg.timeline} isPending={msg.isPending} />
                )}

                <div className={`bubble ${msg.isOwnUser ? (msg.isAi ? "bubble-u" : "bubble-u") : "bubble-a"}`} style={msg.isAi ? { background: "rgba(217,119,87,0.15)", border: "1px solid rgba(217,119,87,0.3)", color: "#f2f0eb" } : {}}>
                  {msg.isPending ? (
                    <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      <span className="dot" style={{ background: "#d97757", animationDelay: "0ms" }} />
                      <span className="dot" style={{ background: "#d97757", animationDelay: "180ms" }} />
                      <span className="dot" style={{ background: "#d97757", animationDelay: "360ms" }} />
                    </span>
                  ) : (
                    msg.content?.split('\n').map((line, i, a) => (
                      <span key={i}>{line}{i !== a.length - 1 && <br />}</span>
                    ))
                  )}
                </div>
                
                {msg.sources?.length > 0 && (
                  <div className="sources" style={{ justifyContent: msg.isOwnUser ? "flex-end" : "flex-start" }}>
                    {msg.sources.map((s, i) => (
                      <span key={i} className="source-badge">
                        <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {s.source}{s.page ? ` · p${s.page}` : ""}
                      </span>
                    ))}
                  </div>
                )}

              </div>
              
              {msg.isOwnUser && !msg.isAi && <div className="user-avatar-msg">{msg.initials}</div>}
              {msg.isOwnUser && msg.isAi && <div className="ai-avatar" style={{ background: "rgba(217,119,87,0.2)" }}><IconBolt /></div>}
            </div>
          ))}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={s.inputArea}>
          <div className="input-wrapper" style={{ margin: 0, maxWidth: "100%" }}>
            <div className="input-bar" style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, display: "flex", gap: 10, padding: "8px 8px 8px 14px" }}>
              <PinUpload session={session} />
              <textarea
                className="chat-input"
                placeholder="Message the group, or start with @ai to query documents…"
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendQuestion(); } }}
                rows={1}
                disabled={sending}
              />
              <button 
                onClick={sendQuestion} 
                disabled={!question.trim() || sending} 
                className="send-btn"
              >
                {sending ? (
                  <svg style={{ animation: "spin 0.8s linear infinite" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                ) : (
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
            <div className="input-hint">Shift+Enter for new line · drag & drop files to attach</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  root: {
    display: "flex",
    height: "100vh",
    background: "#0d0d0d",
    color: "#f2f0eb",
    fontFamily: "'Inter', -apple-system, sans-serif",
    overflow: "hidden",
  },
  sidebar: {
    flexShrink: 0,
    background: "#161616",
    borderRight: "1px solid rgba(255,255,255,0.07)",
    pointerEvents: "auto",
  },
  sidebarInner: { padding: "16px 14px", display: "flex", flexDirection: "column", gap: 0, height: "100%", width: 240 },
  backBtn: {
    display: "flex", alignItems: "center", gap: 7,
    padding: "8px 10px", borderRadius: 8,
    background: "transparent", border: "1px solid transparent",
    color: "#6b6963", fontSize: 12.5, cursor: "pointer",
    fontFamily: "'Inter', sans-serif", transition: "all 0.2s",
    marginBottom: 8, width: "100%",
  },
  sidebarDivider: { height: 1, background: "rgba(255,255,255,0.07)", margin: "8px 0" },
  sidebarLabel: { fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#3d3b38", marginTop: 14, marginBottom: 6 },
  roomNameSidebar: { fontSize: 13.5, fontWeight: 600, color: "#f2f0eb", lineHeight: 1.3, marginBottom: 14 },
  codeCard: {
    padding: "12px", borderRadius: 10,
    background: "rgba(217,119,87,0.04)",
    border: "1px solid rgba(217,119,87,0.18)",
    cursor: "pointer", marginBottom: 6,
    transition: "all 0.2s ease",
  },
  codeLabel: { fontSize: 10, color: "#6b6963", marginBottom: 4 },
  codeValue: { fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 600, color: "#d97757", letterSpacing: "0.14em" },
  codeCopied: { fontSize: 10, color: "#4ade80", marginTop: 3, minHeight: 14 },
  membersList: { display: "flex", flexDirection: "column", gap: 6 },
  memberEmpty: { fontSize: 12, color: "#3d3b38" },
  memberItem: { display: "flex", alignItems: "center", gap: 8 },
  memberDot: { width: 6, height: 6, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px rgba(74,222,128,0.6)", flexShrink: 0 },
  memberName: { fontSize: 12.5, color: "#b5b2ab" },
  floatToggle: {
    position: "fixed", top: 12, left: 12, zIndex: 50,
    width: 32, height: 32, borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "#1e1e1e", color: "#b5b2ab",
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    transition: "all 0.2s", boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
  },
  floatToggleHidden: { opacity: 0, pointerEvents: "none" },
  main: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0 },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 24px", height: 56, flexShrink: 0,
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    background: "#0d0d0d",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  collapseHeaderBtn: {
    width: 30, height: 30, borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "transparent", color: "#6b6963",
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    transition: "all 0.2s",
  },
  headerTitle: { fontSize: 14, fontWeight: 600, color: "#f2f0eb", letterSpacing: "-0.01em" },
  headerSub: { fontSize: 11, color: "#6b6963", marginTop: 1 },
  liveBadge: {
    display: "flex", alignItems: "center", gap: 6,
    fontSize: 11, fontWeight: 500, color: "#4ade80",
    background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)",
    padding: "4px 10px", borderRadius: 9999,
  },
  liveDot: {
    width: 6, height: 6, borderRadius: "50%",
    background: "#4ade80", boxShadow: "0 0 6px rgba(74,222,128,0.7)",
    animation: "livePulse 2s ease infinite",
    display: "inline-block",
  },
  messages: { flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: 20 },
  emptyState: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", flex: 1, gap: 10,
  },
  emptyIcon: {
    width: 52, height: 52, borderRadius: 14,
    background: "#161616", border: "1px solid rgba(255,255,255,0.07)",
    display: "flex", alignItems: "center", justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 14, fontWeight: 600, color: "#f2f0eb" },
  emptySub: { fontSize: 12.5, color: "#6b6963" },
  inputArea: { padding: "14px 24px 20px", flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.07)", background: "#0d0d0d" },
};
