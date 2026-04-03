import { useState, useRef, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const ACCEPTED = ".pdf,.xlsx,.xls,.eml,.txt";

function TypingDots() {
  return (
    <span
      style={{
        display: "inline-flex",
        gap: 4,
        alignItems: "center",
        padding: "2px 0",
      }}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#888",
            display: "inline-block",
            animation: "blink 1.2s infinite",
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
      <style>{`@keyframes blink { 0%,80%,100%{opacity:0.2} 40%{opacity:1} }`}</style>
    </span>
  );
}

function SourcePills({ sources }) {
  if (!sources?.length) return null;
  const unique = [
    ...new Map(sources.map((s) => [s.source + s.page + s.row, s])).values(),
  ].slice(0, 6);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
      {unique.map((s, i) => (
        <span
          key={i}
          style={{
            fontSize: 11,
            padding: "3px 8px",
            borderRadius: 6,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "#999",
            fontFamily: "monospace",
          }}
        >
          {s.source?.split("/").pop() ?? "doc"}
          {s.page ? ` · p${s.page}` : ""}
          {s.row ? ` · row ${s.row}` : ""}
        </span>
      ))}
    </div>
  );
}

function ConflictAlert({ conflicts }) {
  if (!conflicts?.length) return null;
  return (
    <div
      style={{
        marginTop: 10,
        padding: "8px 12px",
        borderRadius: 8,
        background: "rgba(255, 150, 50, 0.08)",
        border: "1px solid rgba(255,150,50,0.25)",
        fontSize: 12,
        color: "#ffa040",
        lineHeight: 1.5,
      }}
    >
      ⚠️ {conflicts.join(" | ")}
    </div>
  );
}

function Timeline({ timeline }) {
  if (!timeline?.length) return null;

  return (
    <div style={{ marginTop: 14 }}>
      {timeline.map((group, gi) => (
        <div
          key={gi}
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10,
            padding: "12px 14px",
            marginBottom: 10,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#888",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 12,
            }}
          >
            📈 Change history · {group.topic}
          </div>

          <div style={{ position: "relative", paddingLeft: 16 }}>
            {/* vertical line */}
            <div
              style={{
                position: "absolute",
                left: 5,
                top: 6,
                bottom: 6,
                width: 1,
                background: "rgba(255,255,255,0.1)",
              }}
            />

            {group.entries.map((entry, ei) => {
              const isLast = ei === group.entries.length - 1;
              return (
                <div
                  key={ei}
                  style={{
                    position: "relative",
                    marginBottom: isLast ? 0 : 14,
                    paddingLeft: 16,
                  }}
                >
                  {/* dot */}
                  <div
                    style={{
                      position: "absolute",
                      left: -4,
                      top: 4,
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: entry.isTrusted ? "#c0392b" : "#444",
                      border: entry.isTrusted ? "none" : "1px solid #555",
                      zIndex: 1,
                    }}
                  />

                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: entry.isTrusted ? "#eee" : "#666",
                      }}
                    >
                      {entry.value}
                    </span>
                    {entry.isTrusted && (
                      <span
                        style={{
                          fontSize: 10,
                          padding: "1px 6px",
                          borderRadius: 4,
                          background: "rgba(192,57,43,0.2)",
                          color: "#e74c3c",
                          fontWeight: 600,
                        }}
                      >
                        current
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>
                    {entry.date
                      ? new Date(entry.date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "Unknown date"}
                    {" · "}
                    {entry.source?.split("/").pop() ?? entry.source}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function ChatMessage({ msg }) {
  const isUser = msg.role === "user";
  const isUpload = msg.role === "upload";

  if (isUpload) {
    return (
      <div
        style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}
      >
        <div
          style={{
            fontSize: 12,
            color: msg.error ? "#e74c3c" : "#4caf7d",
            background: msg.error
              ? "rgba(231,76,60,0.08)"
              : "rgba(76,175,125,0.08)",
            border: `1px solid ${msg.error ? "rgba(231,76,60,0.2)" : "rgba(76,175,125,0.2)"}`,
            borderRadius: 8,
            padding: "6px 14px",
          }}
        >
          {msg.error ? `✗ ${msg.content}` : `✓ ${msg.content}`}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isUser ? "row-reverse" : "row",
        gap: 10,
        marginBottom: 24,
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: "50%",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          fontWeight: 600,
          background: isUser ? "#c0392b" : "#1e1e2a",
          border: isUser ? "none" : "1px solid rgba(255,255,255,0.12)",
          color: "#fff",
          marginTop: 2,
        }}
      >
        {isUser ? "U" : "✦"}
      </div>

      <div style={{ maxWidth: "72%", minWidth: 0 }}>
        <div
          style={{
            padding: "11px 15px",
            borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
            background: isUser
              ? "linear-gradient(135deg,#c0392b,#e74c3c)"
              : "rgba(255,255,255,0.05)",
            border: isUser ? "none" : "1px solid rgba(255,255,255,0.09)",
            color: "#eee",
            fontSize: 14,
            lineHeight: 1.65,
          }}
        >
          {msg.pending ? (
            <TypingDots />
          ) : (
            <span style={{ whiteSpace: "pre-wrap" }}>{msg.content}</span>
          )}
        </div>
        {!isUser && !msg.pending && (
          <>
            <ConflictAlert conflicts={msg.conflicts} />
            <Timeline timeline={msg.timeline} />
            <SourcePills sources={msg.sources} />
          </>
        )}
      </div>
    </div>
  );
}

export default function ChatBot() {
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "ai",
      content:
        "Hello! Ask me anything about your documents. Use the 📎 button to upload files.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const q = input.trim();
    if (!q || loading) return;

    const userMsg = { id: Date.now() + "u", role: "user", content: q };
    const pendingMsg = {
      id: Date.now() + "a",
      role: "ai",
      content: "",
      pending: true,
    };

    setMessages((prev) => [...prev, userMsg, pendingMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();

      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingMsg.id
            ? {
                ...m,
                content: data.answer,
                sources: data.sources,
                conflicts: data.conflicts,
                timeline: data.timeline,
                pending: false,
              }
            : m,
        ),
      );
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingMsg.id
            ? {
                ...m,
                content: "Something went wrong. Please try again.",
                pending: false,
              }
            : m,
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setUploading(true);
    const uploadingMsg = {
      id: Date.now() + "up",
      role: "upload",
      content: `Uploading ${file.name}...`,
    };
    setMessages((prev) => [...prev, uploadingMsg]);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_BASE}/api/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setMessages((prev) =>
        prev.map((m) =>
          m.id === uploadingMsg.id
            ? {
                ...m,
                content: `${file.name} uploaded — ${data.chunks} chunks ingested`,
              }
            : m,
        ),
      );
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === uploadingMsg.id
            ? {
                ...m,
                content: err.message,
                error: true,
              }
            : m,
        ),
      );
    } finally {
      setUploading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "#0f0f13",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 24px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "#1e1e2a",
            border: "1px solid rgba(255,255,255,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            color: "#ddd",
          }}
        >
          ✦
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#eee" }}>
            Document Assistant
          </div>
          <div style={{ fontSize: 12, color: "#666" }}>
            Ask anything about your uploaded files
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px 20px",
          display: "flex",
          flexDirection: "column",
          scrollbarWidth: "thin",
          scrollbarColor: "#333 transparent",
        }}
      >
        <div style={{ maxWidth: 760, width: "100%", margin: "0 auto" }}>
          {messages.map((msg) => (
            <ChatMessage key={msg.id} msg={msg} />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div
        style={{
          padding: "16px 20px 20px",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(255,255,255,0.01)",
        }}
      >
        <div
          style={{
            maxWidth: 760,
            margin: "0 auto",
            display: "flex",
            gap: 8,
            alignItems: "flex-end",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 14,
            padding: "8px",
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED}
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || loading}
            title="Upload document (pdf, xlsx, eml, txt)"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: "none",
              background: "transparent",
              color: uploading ? "#c0392b" : "#555",
              cursor: uploading || loading ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            {uploading ? "⏳" : "📎"}
          </button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about your documents..."
            rows={1}
            disabled={loading}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#eee",
              fontSize: 14,
              lineHeight: 1.5,
              resize: "none",
              fontFamily: "inherit",
              padding: "8px 4px",
              maxHeight: 120,
              overflowY: "auto",
            }}
            onInput={(e) => {
              e.target.style.height = "auto";
              e.target.style.height =
                Math.min(e.target.scrollHeight, 120) + "px";
            }}
          />

          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: "none",
              background:
                input.trim() && !loading ? "#c0392b" : "rgba(255,255,255,0.08)",
              color: input.trim() && !loading ? "#fff" : "#555",
              cursor: input.trim() && !loading ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              flexShrink: 0,
              transition: "background 0.15s, color 0.15s",
            }}
          >
            ↑
          </button>
        </div>
        <div
          style={{
            textAlign: "center",
            marginTop: 8,
            fontSize: 11,
            color: "#444",
          }}
        >
          📎 to upload · Enter to send · Shift+Enter for new line · pdf, xlsx,
          eml, txt
        </div>
      </div>
    </div>
  );
}
