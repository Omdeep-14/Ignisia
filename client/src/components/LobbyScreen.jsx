import { useState, useEffect } from "react";

const API = "http://localhost:5000";

export default function LobbyScreen({ session, onJoinRoom, onSignOut, onSoloChat }) {
  const [rooms, setRooms] = useState([]);
  const [profile, setProfile] = useState(null);
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const token = session.access_token;
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { fetchProfile(); fetchRooms(); }, []);

  async function fetchProfile() {
    setProfile({ display_name: session?.user?.display_name, org_id: session?.user?.org_id });
    setOrgName(`Org: ${session?.user?.org_id}`); 
  }

  async function fetchRooms() {
    setLoading(true);
    const res = await fetch(`${API}/api/rooms`, { headers });
    const data = await res.json();
    setRooms(data.rooms ?? []);
    setLoading(false);
  }

  async function createRoom() {
    if (!newRoomName.trim()) return;
    setCreating(true); setError("");
    const res = await fetch(`${API}/api/rooms/create`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ name: newRoomName.trim() }),
    });
    const data = await res.json();
    if (data.error) { setError(data.error); setCreating(false); return; }
    setCreating(false); setShowCreate(false); setNewRoomName("");
    onJoinRoom(data.room, session);
  }

  async function joinRoom() {
    if (!joinCode.trim()) return;
    setError("");
    const res = await fetch(`${API}/api/rooms/join`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ code: joinCode.trim() }),
    });
    const data = await res.json();
    if (data.error) { setError(data.error); return; }
    onJoinRoom(data.room, session);
  }

  const initials = profile?.display_name
    ? profile.display_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : session.user.email?.[0]?.toUpperCase() ?? "?";

  return (
    <div style={s.root}>
      <div style={s.gridOverlay} />

      {/* Header */}
      <header style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.headerLogo}>
            <svg width="15" height="15" fill="none" stroke="#fff" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <div style={s.headerBrand}>Ignisia</div>
            {orgName && <div style={s.headerOrg}>{orgName}</div>}
          </div>
        </div>
        <div style={s.headerRight}>
          {onSoloChat && (
            <button style={s.soloChatBtn} onClick={onSoloChat}
              onMouseEnter={e => Object.assign(e.currentTarget.style, s.soloChatBtnHover)}
              onMouseLeave={e => Object.assign(e.currentTarget.style, { background: "rgba(217,119,87,0.1)", borderColor: "rgba(217,119,87,0.25)" })}
            >
              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-3.49-.64L3 21l1.64-4.51A8.003 8.003 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Back to Solo Chat
            </button>
          )}
          <div style={s.userChip}>
            <div style={s.userAvatar}>{initials}</div>
            <span style={s.userName}>{profile?.display_name ?? session.user.email}</span>
          </div>
          <button style={s.signOutBtn} onClick={onSignOut}
            onMouseEnter={e => Object.assign(e.currentTarget.style, { color: "#f2f0eb" })}
            onMouseLeave={e => Object.assign(e.currentTarget.style, { color: "#6b6963" })}
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Main content */}
      <main style={s.main}>
        <div style={s.container}>

          {/* Hero */}
          <div style={s.hero}>
            <h2 style={s.heroTitle}>Collaborative Rooms</h2>
            <p style={s.heroSub}>Create or join a shared workspace to query documents as a team.</p>
          </div>

          {/* Action row */}
          <div style={s.actionRow}>
            {/* Join with code */}
            <div style={s.card}>
              <div style={s.cardLabel}>
                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Join with invite code
              </div>
              <div style={s.inputRow}>
                <input
                  type="text"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === "Enter" && joinRoom()}
                  placeholder="e.g. FIN4BZ29"
                  maxLength={8}
                  style={{ ...s.input, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.12em" }}
                  onFocus={e => Object.assign(e.target.style, s.inputFocus)}
                  onBlur={e => Object.assign(e.target.style, { borderColor: "rgba(255,255,255,0.08)", boxShadow: "none" })}
                />
                <button
                  onClick={joinRoom}
                  disabled={joinCode.length < 6}
                  style={{ ...s.btn, ...(joinCode.length < 6 ? s.btnDisabled : {}) }}
                  onMouseEnter={e => { if (joinCode.length >= 6) Object.assign(e.currentTarget.style, s.btnHover); }}
                  onMouseLeave={e => Object.assign(e.currentTarget.style, { background: "#d97757", transform: "none" })}
                >
                  Join
                </button>
              </div>
            </div>

            {/* Create room */}
            <div style={s.card}>
              <div style={s.cardLabel}>
                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create new room
              </div>
              {showCreate ? (
                <div style={s.inputRow}>
                  <input
                    type="text"
                    value={newRoomName}
                    onChange={e => setNewRoomName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && createRoom()}
                    placeholder="e.g. Q3 Audit Review"
                    autoFocus
                    style={s.input}
                    onFocus={e => Object.assign(e.target.style, s.inputFocus)}
                    onBlur={e => Object.assign(e.target.style, { borderColor: "rgba(255,255,255,0.08)", boxShadow: "none" })}
                  />
                  <button
                    onClick={createRoom}
                    disabled={creating || !newRoomName.trim()}
                    style={{ ...s.btn, ...(creating || !newRoomName.trim() ? s.btnDisabled : {}) }}
                    onMouseEnter={e => { if (!creating && newRoomName.trim()) Object.assign(e.currentTarget.style, s.btnHover); }}
                    onMouseLeave={e => Object.assign(e.currentTarget.style, { background: "#d97757", transform: "none" })}
                  >
                    {creating ? "…" : "Create"}
                  </button>
                </div>
              ) : (
                <button
                  style={s.createToggle}
                  onClick={() => setShowCreate(true)}
                  onMouseEnter={e => Object.assign(e.currentTarget.style, { background: "rgba(217,119,87,0.14)", borderColor: "rgba(217,119,87,0.4)" })}
                  onMouseLeave={e => Object.assign(e.currentTarget.style, { background: "rgba(217,119,87,0.08)", borderColor: "rgba(217,119,87,0.22)" })}
                >
                  + New room
                </button>
              )}
            </div>
          </div>

          {error && (
            <div style={s.errorBox}>
              <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* Room list */}
          <div style={s.roomsHeader}>
            <span style={s.sectionLabel}>Active rooms</span>
            <span style={s.roomCount}>{rooms.length} room{rooms.length !== 1 ? "s" : ""}</span>
          </div>

          {loading ? (
            <div style={s.emptyState}>
              <svg style={{ animation: "spin 0.8s linear infinite" }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b6963" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            </div>
          ) : rooms.length === 0 ? (
            <div style={s.emptyState}>
              <div style={s.emptyIcon}>
                <svg width="22" height="22" fill="none" stroke="#6b6963" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p style={s.emptyTitle}>No rooms yet</p>
              <p style={s.emptySub}>Create a room to get started with your team.</p>
            </div>
          ) : (
            <div style={s.roomList}>
              {rooms.map(room => (
                <div
                  key={room.id}
                  style={s.roomCard}
                  onClick={() => onJoinRoom(room, session)}
                  onMouseEnter={e => Object.assign(e.currentTarget.style, s.roomCardHover)}
                  onMouseLeave={e => Object.assign(e.currentTarget.style, { background: "#161616", borderColor: "rgba(255,255,255,0.07)", transform: "none" })}
                >
                  <div style={s.roomIcon}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div style={s.roomInfo}>
                    <div style={s.roomName}>{room.name}</div>
                    <div style={s.roomMeta}>Created {new Date(room.created_at).toLocaleDateString()}</div>
                  </div>
                  <div style={s.roomRight}>
                    <span style={s.roomCode}>{room.code}</span>
                    <svg width="14" height="14" fill="none" stroke="#d97757" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const s = {
  root: {
    minHeight: "100vh",
    background: "#0d0d0d",
    fontFamily: '"Söhne", "Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    color: "#f2f0eb",
    position: "relative",
    overflow: "auto",
  },
  gridOverlay: {
    position: "fixed",
    inset: 0,
    backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
    backgroundSize: "40px 40px",
    pointerEvents: "none",
    zIndex: 0,
  },
  header: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 28px",
    height: "60px",
    background: "rgba(13,13,13,0.9)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  headerLogo: {
    width: 32, height: 32, borderRadius: 9,
    background: "linear-gradient(135deg, #d97757, #b85f3a)",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 2px 8px rgba(217,119,87,0.3)",
  },
  headerBrand: { fontSize: 15, fontWeight: 700, color: "#f2f0eb", letterSpacing: "-0.01em" },
  headerOrg: { fontSize: 11, color: "#6b6963", marginTop: 1 },
  headerRight: { display: "flex", alignItems: "center", gap: 14 },
  soloChatBtn: {
    display: "flex", alignItems: "center", gap: 7,
    padding: "7px 14px", borderRadius: 9,
    background: "rgba(217,119,87,0.1)",
    border: "1px solid rgba(217,119,87,0.25)",
    color: "#d97757", fontSize: 12.5, fontWeight: 500,
    cursor: "pointer", fontFamily: "'Inter', sans-serif",
    transition: "all 0.2s ease",
  },
  soloChatBtnHover: { background: "rgba(217,119,87,0.18)", borderColor: "rgba(217,119,87,0.45)" },
  userChip: { display: "flex", alignItems: "center", gap: 8 },
  userAvatar: {
    width: 28, height: 28, borderRadius: "50%",
    background: "linear-gradient(135deg, #d97757, #b85f3a)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 11, fontWeight: 700, color: "#fff",
  },
  userName: { fontSize: 12.5, color: "#b5b2ab", fontWeight: 500 },
  signOutBtn: {
    background: "none", border: "none",
    color: "#6b6963", fontSize: 12, cursor: "pointer",
    fontFamily: "'Inter', sans-serif", transition: "color 0.2s",
  },
  main: { position: "relative", zIndex: 1, padding: "48px 28px" },
  container: { maxWidth: 700, margin: "0 auto" },
  hero: { marginBottom: 36 },
  heroTitle: { fontSize: 24, fontWeight: 700, color: "#f2f0eb", letterSpacing: "-0.02em", marginBottom: 6 },
  heroSub: { fontSize: 13.5, color: "#6b6963", lineHeight: 1.6 },
  actionRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 },
  card: {
    background: "#161616", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 14, padding: "18px 18px",
  },
  cardLabel: {
    display: "flex", alignItems: "center", gap: 7,
    fontSize: 12, fontWeight: 600, color: "#6b6963",
    textTransform: "uppercase", letterSpacing: "0.06em",
    marginBottom: 12,
  },
  inputRow: { display: "flex", gap: 8 },
  input: {
    flex: 1, background: "#0d0d0d",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 9, padding: "9px 12px",
    color: "#f2f0eb", fontSize: 13, outline: "none",
    fontFamily: "'Inter', sans-serif",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  inputFocus: { borderColor: "rgba(217,119,87,0.45)", boxShadow: "0 0 0 3px rgba(217,119,87,0.08)" },
  btn: {
    padding: "9px 16px", borderRadius: 9,
    background: "#d97757", border: "none",
    color: "#fff", fontSize: 13, fontWeight: 600,
    cursor: "pointer", fontFamily: "'Inter', sans-serif",
    transition: "all 0.2s ease", flexShrink: 0,
    boxShadow: "0 2px 8px rgba(217,119,87,0.25)",
  },
  btnHover: { background: "#c96848", transform: "translateY(-1px)" },
  btnDisabled: { opacity: 0.35, cursor: "not-allowed" },
  createToggle: {
    width: "100%", padding: "10px",
    background: "rgba(217,119,87,0.08)", border: "1px solid rgba(217,119,87,0.22)",
    borderRadius: 9, color: "#d97757", fontSize: 13, fontWeight: 500,
    cursor: "pointer", fontFamily: "'Inter', sans-serif",
    transition: "all 0.2s ease",
  },
  errorBox: {
    display: "flex", alignItems: "center", gap: 7,
    padding: "10px 14px", borderRadius: 9, marginBottom: 16,
    background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)",
    color: "#f87171", fontSize: 12.5,
  },
  roomsHeader: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionLabel: { fontSize: 11, fontWeight: 600, color: "#6b6963", textTransform: "uppercase", letterSpacing: "0.08em" },
  roomCount: { fontSize: 11, color: "#3d3b38" },
  emptyState: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", padding: "60px 0", gap: 10,
  },
  emptyIcon: {
    width: 52, height: 52, borderRadius: 14,
    background: "#161616", border: "1px solid rgba(255,255,255,0.07)",
    display: "flex", alignItems: "center", justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 14, fontWeight: 600, color: "#f2f0eb" },
  emptySub: { fontSize: 12.5, color: "#6b6963" },
  roomList: { display: "flex", flexDirection: "column", gap: 8 },
  roomCard: {
    display: "flex", alignItems: "center", gap: 14,
    padding: "16px 18px", borderRadius: 14,
    background: "#161616", border: "1px solid rgba(255,255,255,0.07)",
    cursor: "pointer", transition: "all 0.2s ease",
  },
  roomCardHover: {
    background: "#1e1e1e",
    borderColor: "rgba(217,119,87,0.2)",
    transform: "translateY(-1px)",
  },
  roomIcon: {
    width: 38, height: 38, borderRadius: 10,
    background: "rgba(217,119,87,0.1)", border: "1px solid rgba(217,119,87,0.18)",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#d97757", flexShrink: 0,
  },
  roomInfo: { flex: 1, minWidth: 0 },
  roomName: { fontSize: 13.5, fontWeight: 600, color: "#f2f0eb" },
  roomMeta: { fontSize: 11.5, color: "#6b6963", marginTop: 2 },
  roomRight: { display: "flex", alignItems: "center", gap: 10, flexShrink: 0 },
  roomCode: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11.5, color: "#d97757",
    background: "rgba(217,119,87,0.08)",
    border: "1px solid rgba(217,119,87,0.18)",
    padding: "3px 9px", borderRadius: 6,
    letterSpacing: "0.08em",
  },
};
