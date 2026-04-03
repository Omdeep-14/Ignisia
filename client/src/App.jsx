import { useState, useRef, useEffect } from "react";
import "./App.css";
import { supabase } from "./lib/supabase";
import AuthScreen from "./components/AuthScreen";
import LobbyScreen from "./components/LobbyScreen";
import RoomScreen from "./components/RoomScreen";

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconBolt() {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}
function IconPlus() {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}
function IconMenu() {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}
function IconChevronLeft() {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}
function IconMsg() {
  return (
    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-3.49-.64L3 21l1.64-4.51A8.003 8.003 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}
function IconFile() {
  return (
    <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
function IconUser() {
  return (
    <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}
function IconLogout() {
  return (
    <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}
function IconSettings() {
  return (
    <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function IconPDF() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}
function IconClose() {
  return (
    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
function IconTrash() {
  return (
    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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

// ── Shared UI ─────────────────────────────────────────────────────────────────

function SourceBadge({ source }) {
  return (
    <span className="source-badge">
      <IconFile />
      {source.source}
      {source.page && <span className="source-page">· p{source.page}</span>}
    </span>
  );
}

// Gemini-style analyzing thought process box
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
    <div className="analyzing-box">
      <button onClick={() => !isPending && setOpen(!open)} className="analyzing-toggle" style={{ cursor: isPending ? 'default' : 'pointer', opacity: isPending ? 0.8 : 1 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent)' }}>
          <IconSparkles /> {title}
        </span>
        <svg className={open ? "rot" : ""} width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="analyzing-content">
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

function MessageBubble({ message, userInitials }) {
  const isUser = message.role === "user";
  return (
    <div className={`msg-row ${isUser ? "msg-u" : "msg-a"}`}>
      {!isUser && <div className="ai-avatar"><IconBolt /></div>}
      <div className="msg-wrap">
        {!isUser && (
          <AnalyzingBox 
            conflicts={message.conflicts} 
            crmTicket={message.crmTicket} 
            timeline={message.timeline} 
            isPending={message.isPending}
          />
        )}
        <div className={`bubble ${isUser ? "bubble-u" : "bubble-a"} ${message.isPending ? "typing" : ""}`}>
          {message.isPending ? (
            <>
              <span className="dot" style={{ animationDelay: "0ms" }} />
              <span className="dot" style={{ animationDelay: "180ms" }} />
              <span className="dot" style={{ animationDelay: "360ms" }} />
            </>
          ) : (
            message.content?.split('\n').map((line, i, a) => (
              <span key={i}>
                {line}
                {i !== a.length - 1 && <br />}
              </span>
            ))
          )}
        </div>
        {!isUser && message.sources?.length > 0 && (
          <div className="sources">
            {message.sources
              .filter((s, i, a) => a.findIndex(x => x.source === s.source && x.page === s.page) === i)
              .map((s, i) => <SourceBadge key={i} source={s} />)}
          </div>
        )}
      </div>
      {isUser && <div className="user-avatar-msg">{userInitials}</div>}
    </div>
  );
}



// ── User profile popup ────────────────────────────────────────────────────────

function ProfilePopup({ open, onClose, onSignOut, profile, user }) {
  const initials = profile?.display_name ? profile.display_name.substring(0,2).toUpperCase() : (user?.email ? user.email.substring(0,2).toUpperCase() : "?");
  const orgName = user?.email ? user.email.split("@")[1] : "Workspace";

  return (
    <>
      {open && <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 99, background: "transparent" }} onClick={onClose} />}
      <div className={`profile-popup-overlay ${open ? "open" : ""}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className={`profile-popup ${open ? "open" : ""}`}>
          <div className="profile-popup-header">
            <div className="profile-popup-avatar">{initials}</div>
            <div>
              <div className="profile-popup-name">{profile?.display_name || user?.email}</div>
              <div className="profile-popup-email">{user?.email}</div>
              <span className="profile-popup-org">{orgName} Workspace</span>
            </div>
          </div>
          <div className="profile-popup-menu">
            <button className="profile-menu-item"><IconUser /> Profile settings</button>
            <button className="profile-menu-item"><IconSettings /> Preferences</button>
            <div className="divider" />
            <button className="profile-menu-item danger" onClick={onSignOut}><IconLogout /> Sign out</button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Pin/upload button ─────────────────────────────────────────────────────────

export function PinUpload({ session }) {
  const [uploading, setUploading] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [showToast, setShowToast] = useState(null);
  const inputRef = useRef(null);

  async function uploadFile(file) {
    setUploading(true);
    setUploadName(file.name);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const token = session?.access_token || session?.token;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const res = await fetch("http://localhost:5000/api/upload", { 
        method: "POST", 
        headers,
        body: formData 
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setShowToast({ ok: true, msg: `${data.file} · ${data.chunks} chunks` });
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
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) uploadFile(f); }}
      >
        <input
          ref={inputRef} type="file" accept=".pdf,.xlsx,.xls,.eml,.txt"
          style={{ display: "none" }}
          onChange={e => { const f = e.target.files[0]; if (f) uploadFile(f); }}
        />
        {uploading ? (
          <svg className="spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
          </svg>
        )}
      </button>
      {showToast && (
        <div className={`toast ${showToast.ok ? "toast-ok" : "toast-err"}`}>
          {showToast.ok ? "✓" : "✗"} {showToast.msg}
        </div>
      )}
      {uploading && (
        <div style={{ position: "absolute", left: -10, top: -30, whiteSpace: "nowrap", fontSize: 11, background: "var(--bg-elevated)", padding: "4px 8px", borderRadius: 4, color: "var(--text-muted)", border: "1px solid var(--border)", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
          Uploading {uploadName}...
        </div>
      )}
    </div>
  );
}

// ── Chat input ────────────────────────────────────────────────────────────────

function ChatInput({ onSend, loading, session }) {
  const [value, setValue] = useState("");
  const submit = () => {
    if (!value.trim() || loading) return;
    onSend(value.trim());
    setValue("");
  };
  return (
    <div className="input-wrapper">
      <div className="input-bar">
        <PinUpload session={session} />
        <textarea
          className="chat-input"
          placeholder="Ask anything about your documents…"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
          rows={1}
          disabled={loading}
        />
        <button onClick={submit} disabled={!value.trim() || loading} className="send-btn">
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
      <div className="input-hint">Shift+Enter for new line · drag & drop files to attach</div>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar({ collapsed, onToggle, chats, activeChatId, onSelectChat, onNewChat, onMyStuff, onDeleteChat, session, profile }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const user = session?.user;
  const initials = profile?.display_name ? profile.display_name.substring(0,2).toUpperCase() : (user?.email ? user.email.substring(0,2).toUpperCase() : "?");

  return (
    <>
      <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="brand-row">
            <div className="brand-logo"><IconBolt /></div>
            <div>
              <div className="brand-name">Ignisia</div>
              <div className="brand-tagline">Document Intelligence</div>
            </div>
          </div>
          <button className="collapse-btn" onClick={onToggle} title="Collapse sidebar">
            <IconChevronLeft />
          </button>
        </div>

        {/* New Chat */}
        <button className="new-chat-btn" onClick={onNewChat}>
          <IconPlus /> New chat
        </button>

        {/* Nav items */}
        <button className="sidebar-nav-item" onClick={onMyStuff}>
          <IconFile /> My Documents
        </button>

        <div className="divider" />

        {/* Chat history */}
        <div className="sidebar-group-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: 14 }}>
          Recent chats
        </div>
        <div className="sidebar-scroll">
          {chats.length === 0 && (
            <div style={{ padding: "10px 14px", fontSize: 11.5, color: "var(--text-muted)" }}>
              No chats yet
            </div>
          )}
          {chats.map(chat => (
            <div
              key={chat.id}
              className={`chat-history-item ${chat.id === activeChatId ? "active" : ""}`}
              onClick={() => onSelectChat(chat.id)}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                <IconMsg />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{chat.title}</span>
              </div>
              <button 
                className="delete-chat-btn" 
                onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id); }}
                title="Delete chat"
              >
                <IconTrash />
              </button>
            </div>
          ))}
        </div>

        {/* Footer / Profile */}
        <div className="sidebar-footer">
          <button className="user-profile-btn" onClick={() => setProfileOpen(v => !v)}>
            <div className="user-avatar-circle">{initials}</div>
            <div className="user-info">
              <div className="user-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                {profile?.display_name || user?.email}
              </div>
              <div className="user-role">Member</div>
            </div>
          </button>
        </div>
      </aside>

      <ProfilePopup
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        onSignOut={() => { 
          setProfileOpen(false); 
          supabase.auth.signOut();
        }}
        session={session}
        user={user}
        profile={profile}
      />
    </>
  );
}

// ── SoloChat screen ───────────────────────────────────────────────────────────

const API_URL = "http://localhost:5000/api/chat";

const QUICK_PROMPTS = [
  "Summarize the key findings",
  "Are there any conflicting details?",
  "What are the main risks?",
  "Extract all pricing information",
];

function SoloChat({ onBack, session, profile }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showMyStuff, setShowMyStuff] = useState(false);
  
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [selectedDocUrl, setSelectedDocUrl] = useState(null);

  // Multi-chat state
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [chatMessages, setChatMessages] = useState({});
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const initialMsg = "Hello! I'm your document intelligence assistant. Upload files or ask me anything about your ingested documents.";

  // Get active messages
  const messages = activeChatId ? (chatMessages[activeChatId] || []) : [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function newChat() {
    const id = Date.now().toString();
    const chat = { id, title: "New Chat" };
    setChats(prev => [chat, ...prev]);
    setChatMessages(prev => ({
      ...prev,
      [id]: [{
        role: "assistant",
        content: initialMsg,
        sources: [], conflicts: [], crmTicket: null,
      }],
    }));
    setActiveChatId(id);
  }

  function deleteChat(id) {
    setChats(prev => prev.filter(c => c.id !== id));
    setChatMessages(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (activeChatId === id) {
      const remaining = chats.filter(c => c.id !== id);
      if (remaining.length > 0) {
        setActiveChatId(remaining[0].id);
      } else {
        newChat();
      }
    }
  }

  // Start with one chat on mount
  useEffect(() => { newChat(); }, []);

  // Fetch documents
  async function fetchDocs() {
    try {
      const token = session?.access_token;
      const res = await fetch("http://localhost:5000/api/uploads/list", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.error) {
        setUploadedDocs(data.files || []);
      }
    } catch (err) {
      console.error(err);
    }
  }

  function toggleMyStuff() {
    if (!showMyStuff) fetchDocs();
    setShowMyStuff(!showMyStuff);
  }

  function selectChat(id) { setActiveChatId(id); }

  async function sendMessage(question) {
    if (!activeChatId) return;

    // Update chat title from first user message
    setChats(prev => prev.map(c =>
      c.id === activeChatId && c.title === "New Chat"
        ? { ...c, title: question.slice(0, 36) + (question.length > 36 ? "…" : "") }
        : c
    ));

    setChatMessages(prev => ({
      ...prev,
      [activeChatId]: [...(prev[activeChatId] || []), { role: "user", content: question }],
    }));
    setLoading(true);

    try {
      const token = session?.access_token;
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setChatMessages(prev => ({
        ...prev,
        [activeChatId]: [...(prev[activeChatId] || []), {
          role: "assistant",
          content: data.answer,
          sources: data.sources || [],
          conflicts: data.conflicts || [],
          crmTicket: data.crmTicket || null,
        }],
      }));
    } catch (err) {
      setChatMessages(prev => ({
        ...prev,
        [activeChatId]: [...(prev[activeChatId] || []), {
          role: "assistant",
          content: `Error: ${err.message}`,
          sources: [], conflicts: [], crmTicket: null,
        }],
      }));
    } finally {
      setLoading(false);
    }
  }

  const isEmptyChat = messages.length <= 1;
  const userInitials = profile?.display_name ? profile.display_name.substring(0,2).toUpperCase() : (session?.user?.email ? session.user.email.substring(0,2).toUpperCase() : "U");

  return (
    <div className="app">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(v => !v)}
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={selectChat}
        onNewChat={newChat}
        onDeleteChat={deleteChat}
        onMyStuff={toggleMyStuff}
        session={session}
        profile={profile}
      />

      {/* Floating toggle when sidebar is collapsed */}
      <button
        className={`sidebar-toggle-floating ${!sidebarCollapsed ? "hidden" : ""}`}
        onClick={() => setSidebarCollapsed(false)}
        title="Open sidebar"
      >
        <IconMenu />
      </button>

      {/* Main Chat Area */}
      <div className="chat-panel" style={{ flex: selectedDocUrl ? 0.5 : 1 }}>
        {/* Header */}
        <header className="chat-header">
          <div className="chat-header-left">
            {onBack && (
              <button onClick={onBack} className="back-btn" title="Back to lobby">
                <IconChevronLeft />
              </button>
            )}
            <div>
              <div className="header-title">Document Chat</div>
              <div className="header-sub">Query across all ingested documents</div>
            </div>
          </div>
          <span className="live-badge">
            <span className="live-dot" /> Live
          </span>
        </header>

        {/* Messages */}
        <div className="messages">
          {isEmptyChat ? (
            <div className="empty-state">
              <div className="empty-icon"><IconBolt /></div>
              <div className="empty-title">What can I help you find?</div>
              <div className="empty-sub">
                Ask anything about your uploaded documents. I'll retrieve relevant information, detect conflicts, and surface key insights.
              </div>
              <div className="quick-suggestions">
                {QUICK_PROMPTS.map((q, i) => (
                  <button key={i} className="suggestion-chip" onClick={() => sendMessage(q)}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => <MessageBubble key={i} message={msg} userInitials={userInitials} />)}
              {loading && <MessageBubble message={{ role: "assistant", isPending: true, content: "" }} userInitials={userInitials} />}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="input-area">
          <ChatInput onSend={sendMessage} loading={loading} session={session} />
        </div>
      </div>

      {/* Right Side Doc Panel */}
      {showMyStuff && (
        <div style={{ flex: selectedDocUrl ? 1.5 : 0.4, borderLeft: "1px solid rgba(255,255,255,0.07)", background: "#111", display: "flex", flexDirection: "column" }}>
          {!selectedDocUrl ? (
            <>
              <div className="chat-header" style={{ justifyContent: "space-between", padding: "0 20px" }}>
                <div className="header-title">My Documents</div>
                <button className="chat-header-left" onClick={() => setShowMyStuff(false)} style={{ background: "transparent", border: "none", color: "#6b6963", cursor: "pointer" }}>
                  <IconClose />
                </button>
              </div>
              <div style={{ padding: 20, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
                {uploadedDocs.length === 0 ? (
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>No documents uploaded yet.</div>
                ) : (
                  uploadedDocs.map((doc, i) => (
                    <div className="pdf-item sidebar-doc-item" key={i} onClick={() => setSelectedDocUrl(doc.url)} style={{ cursor: "pointer" }}>
                      <div className="pdf-icon"><IconPDF /></div>
                      <div>
                        <div className="pdf-name" style={{ fontSize: 12.5 }}>{doc.name}</div>
                        <div className="pdf-meta">{Math.round(doc.size / 1024)} KB · {new Date(doc.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              <div className="chat-header" style={{ justifyContent: "space-between", padding: "0 20px", background: "#1a1a1a" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <IconPDF />
                  <div className="header-title" style={{ fontSize: 13 }}>Document Preview</div>
                </div>
                <button className="chat-header-left" onClick={() => setSelectedDocUrl(null)} style={{ background: "transparent", border: "none", color: "#6b6963", cursor: "pointer" }}>
                  <IconClose />
                </button>
              </div>
              <div style={{ flex: 1, padding: 10, background: "#1a1a1a" }}>
                <iframe src={`https://docs.google.com/viewer?url=${encodeURIComponent(selectedDocUrl)}&embedded=true`} style={{ width: "100%", height: "100%", border: "none", borderRadius: 8, background: "#fff" }} title="PDF Preview" />
              </div>
            </>
          )}
        </div>
      )}

    </div>
  );
}

// ── Root App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeRoom, setActiveRoom] = useState(null);
  const [screen, setScreen] = useState("auth");

  async function fetchProfile(userId) {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (data) setProfile(data);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) { 
        setSession(session); 
        fetchProfile(session.user.id);
        setScreen("lobby"); 
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) { 
        setSession(session); 
        fetchProfile(session.user.id);
        setScreen("lobby"); 
      }
      else { 
        setSession(null); 
        setProfile(null);
        setScreen("auth"); 
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  function handleAuth(session) { 
    setSession(session); 
    fetchProfile(session.user.id);
    setScreen("lobby"); 
  }
  function handleJoinRoom(room) { setActiveRoom(room); setScreen("room"); }
  function handleSignOut() { supabase.auth.signOut(); setSession(null); setProfile(null); setScreen("auth"); }

  if (screen === "auth") return <AuthScreen onAuth={handleAuth} />;
  if (screen === "lobby") return (
    <LobbyScreen
      session={session}
      onJoinRoom={handleJoinRoom}
      onSignOut={handleSignOut}
      onSoloChat={() => setScreen("solo")}
    />
  );
  if (screen === "room") return <RoomScreen room={activeRoom} session={session} profile={profile} onLeave={() => setScreen("lobby")} />;
  if (screen === "solo") return <SoloChat onBack={() => setScreen("lobby")} session={session} profile={profile} />;
}
