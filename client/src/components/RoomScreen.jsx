import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

export default function RoomScreen({ room, session, onLeave }) {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [members, setMembers] = useState([]);
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const channelRef = useRef(null);

  const token = session.access_token;
  const headers = { Authorization: `Bearer ${token}` };
  const API = "http://localhost:5000";

  useEffect(() => {
    fetchMessages();
    setupRealtime();
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchMessages() {
    const res = await fetch(`${API}/api/rooms/${room.id}/messages`, {
      headers,
    });
    const data = await res.json();
    setMessages(data.messages ?? []);
  }

  function setupRealtime() {
    const channel = supabase.channel(`room:${room.id}`, {
      config: { presence: { key: session.user.id } },
    });

    // presence — track who's online
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const online = Object.values(state)
        .flat()
        .map((p) => p.display_name);
      setMembers([...new Set(online)]);
    });

    // new message inserted (pending)
    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "room_messages",
        filter: `room_id=eq.${room.id}`,
      },
      (payload) => {
        setMessages((prev) => {
          if (prev.find((m) => m.id === payload.new.id)) return prev;
          return [...prev, payload.new];
        });
      },
    );

    // message updated (answer arrived)
    channel.on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "room_messages",
        filter: `room_id=eq.${room.id}`,
      },
      (payload) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === payload.new.id ? payload.new : m)),
        );
      },
    );

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", session.user.id)
          .single();

        await channel.track({
          display_name: profile?.display_name ?? session.user.email,
        });
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

  return (
    <div className="h-screen bg-gray-950 text-white flex">
      {/* Sidebar */}
      <div className="w-56 border-r border-gray-800 flex flex-col p-4 shrink-0">
        <button
          onClick={onLeave}
          className="text-xs text-gray-500 hover:text-white mb-5 text-left transition-colors"
        >
          ← Back
        </button>

        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
          Room
        </p>
        <p className="font-semibold text-sm mb-4 leading-tight">{room.name}</p>

        {/* Join code */}
        <div
          onClick={copyCode}
          className="bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-lg px-3 py-2 cursor-pointer transition-colors mb-6"
        >
          <p className="text-xs text-gray-500 mb-0.5">Join code</p>
          <p className="font-mono text-sm text-amber-400 tracking-widest">
            {room.code}
          </p>
          <p className="text-xs text-gray-600 mt-0.5">
            {copied ? "Copied!" : "Click to copy"}
          </p>
        </div>

        {/* Members */}
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
          Online
        </p>
        <div className="space-y-1.5">
          {members.length === 0 ? (
            <p className="text-xs text-gray-600">Just you</p>
          ) : (
            members.map((name) => (
              <div key={name} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                <span className="text-xs text-gray-300 truncate">{name}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main thread */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {messages.length === 0 && (
            <div className="text-center pt-20 text-gray-600">
              <p className="text-sm">No questions yet.</p>
              <p className="text-xs mt-1">Ask anything about your documents.</p>
            </div>
          )}

          {messages.map((msg) => (
            <MessageCard
              key={msg.id}
              msg={msg}
              currentUserId={session.user.id}
            />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-800 p-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendQuestion()}
              placeholder="Ask a question about your documents..."
              className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
            <button
              onClick={sendQuestion}
              disabled={!question.trim() || sending}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-gray-900 font-semibold text-sm px-5 rounded-xl transition-colors"
            >
              {sending ? "..." : "Ask"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageCard({ msg, currentUserId }) {
  const [showTimeline, setShowTimeline] = useState(false);
  const isOwn = msg.user_id === currentUserId;

  return (
    <div className="space-y-3">
      {/* Question */}
      <div className="flex items-start gap-2">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
            isOwn ? "bg-amber-500 text-gray-900" : "bg-gray-700 text-white"
          }`}
        >
          {msg.display_name?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div>
          <span className="text-xs text-gray-500">{msg.display_name}</span>
          <p className="text-sm text-white mt-0.5">{msg.question}</p>
        </div>
      </div>

      {/* Answer */}
      <div className="ml-8 bg-gray-900 border border-gray-800 rounded-xl p-4">
        {msg.is_pending ? (
          <div className="flex items-center gap-2 text-gray-500">
            <span className="text-xs">Thinking</span>
            <span className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1 h-1 rounded-full bg-gray-500 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </span>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-100 leading-relaxed">
              {msg.answer}
            </p>

            {/* Sources */}
            {msg.sources?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {msg.sources.map((s, i) => (
                  <span
                    key={i}
                    className="text-xs bg-gray-800 text-gray-400 border border-gray-700 rounded px-2 py-0.5"
                  >
                    {s.source}
                    {s.page ? ` · p${s.page}` : ""}
                    {s.row ? ` · row ${s.row}` : ""}
                  </span>
                ))}
              </div>
            )}

            {/* Conflict alert */}
            {msg.conflicts?.length > 0 && (
              <div className="mt-3 bg-amber-950 border border-amber-800 rounded-lg px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 text-xs">
                      ⚠ Conflicts detected
                    </span>
                    <span className="text-xs text-amber-600">
                      {msg.conflicts.length} contradiction
                      {msg.conflicts.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  {msg.timeline?.length > 0 && (
                    <button
                      onClick={() => setShowTimeline((v) => !v)}
                      className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      {showTimeline ? "Hide" : "View"} timeline
                    </button>
                  )}
                </div>

                {/* Conflict list */}
                <div className="mt-2 space-y-1">
                  {msg.conflicts.map((c, i) => (
                    <p key={i} className="text-xs text-amber-300">
                      {c.explanation ?? c}
                    </p>
                  ))}
                </div>

                {/* Timeline */}
                {showTimeline && msg.timeline?.length > 0 && (
                  <div className="mt-4 border-t border-amber-900 pt-3 space-y-0">
                    {msg.timeline.map((entry, i) => (
                      <div key={i} className="flex gap-3">
                        {/* Connector */}
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 ${
                              entry.trusted ? "bg-green-400" : "bg-amber-600"
                            }`}
                          />
                          {i < msg.timeline.length - 1 && (
                            <div className="w-px flex-1 bg-amber-900 mt-1" />
                          )}
                        </div>
                        {/* Entry */}
                        <div className="pb-4">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs text-amber-300 font-medium">
                              {entry.date}
                            </span>
                            <span className="text-xs text-amber-700">
                              {entry.source}
                            </span>
                            {entry.trusted && (
                              <span className="text-xs bg-green-900 text-green-400 border border-green-800 rounded px-1.5 py-0.5">
                                Current
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-amber-200">
                            {entry.value}
                          </p>
                          <p className="text-xs text-amber-700 mt-0.5 italic">
                            {entry.sentence}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
