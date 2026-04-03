import { useState, useRef, useEffect } from "react";

// ============================================================
// FILE: src/App.jsx
// Root component — import ChatPage here via React Router later
// e.g. import { BrowserRouter, Routes, Route } from "react-router-dom"
//      <Route path="/" element={<ChatPage />} />
// ============================================================

// ============================================================
// FILE: src/components/SourceBadge.jsx
// A single source pill shown below each answer
// ============================================================
function SourceBadge({ source }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
      <svg
        className="w-3 h-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      {source.source}
      {source.page && <span className="text-blue-400">· p{source.page}</span>}
    </span>
  );
}

// ============================================================
// FILE: src/components/ConflictAlert.jsx
// Shown when conflicting sources are detected
// ============================================================
function ConflictAlert({ conflicts }) {
  if (!conflicts || conflicts.length === 0) return null;
  return (
    <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
      <div className="flex items-center gap-2 mb-1">
        <svg
          className="w-4 h-4 text-amber-600 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          />
        </svg>
        <span className="text-sm font-medium text-amber-700">
          Conflict detected
        </span>
      </div>
      {conflicts.map((c, i) => (
        <p key={i} className="text-xs text-amber-600 leading-relaxed">
          {c}
        </p>
      ))}
    </div>
  );
}

// ============================================================
// FILE: src/components/CRMTicket.jsx
// Collapsible CRM ticket card shown after each answer
// ============================================================
function CRMTicket({ ticket }) {
  const [open, setOpen] = useState(false);
  if (!ticket) return null;
  return (
    <div className="mt-3 rounded-lg border border-gray-200 bg-white overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
            />
          </svg>
          CRM Ticket · {ticket.id}
        </span>
        <svg
          className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {open && (
        <div className="px-3 pb-3 border-t border-gray-100 text-xs text-gray-600 space-y-1.5 pt-2">
          <div className="flex justify-between">
            <span className="text-gray-400">Status</span>
            <span className="px-1.5 py-0.5 rounded bg-green-50 text-green-700 font-medium">
              {ticket.status}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Created</span>
            <span>{new Date(ticket.createdAt).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Conflict</span>
            <span>{ticket.hasConflict ? "Yes" : "No"}</span>
          </div>
          <div>
            <p className="text-gray-400 mb-0.5">Summary</p>
            <p className="text-gray-600 leading-relaxed">{ticket.summary}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// FILE: src/components/MessageBubble.jsx
// Individual chat message — user or assistant
// ============================================================
function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-medium mr-2 shrink-0 mt-1">
          AI
        </div>
      )}
      <div className={`max-w-2xl ${isUser ? "max-w-sm" : ""}`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? "bg-indigo-600 text-white rounded-tr-sm"
              : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm"
          }`}
        >
          {message.content}
        </div>

        {/* Assistant extras */}
        {!isUser && message.sources?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {/* deduplicate sources by source+page */}
            {message.sources
              .filter(
                (s, i, arr) =>
                  arr.findIndex(
                    (x) => x.source === s.source && x.page === s.page,
                  ) === i,
              )
              .map((s, i) => (
                <SourceBadge key={i} source={s} />
              ))}
          </div>
        )}

        {!isUser && <ConflictAlert conflicts={message.conflicts} />}
        {!isUser && <CRMTicket ticket={message.crmTicket} />}
      </div>

      {isUser && (
        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-medium ml-2 shrink-0 mt-1">
          U
        </div>
      )}
    </div>
  );
}

// ============================================================
// FILE: src/components/TypingIndicator.jsx
// Animated dots shown while waiting for API response
// ============================================================
function TypingIndicator() {
  return (
    <div className="flex justify-start mb-4">
      <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-medium mr-2 shrink-0 mt-1">
        AI
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          <span
            className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// FILE: src/components/ChatInput.jsx
// Textarea + send button at the bottom
// ============================================================
function ChatInput({ onSend, loading }) {
  const [value, setValue] = useState("");

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function submit() {
    if (!value.trim() || loading) return;
    onSend(value.trim());
    setValue("");
  }

  return (
    <div className="flex items-end gap-2 p-4 bg-white border-t border-gray-200">
      <textarea
        className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition-all min-h-10 max-h-32"
        placeholder="Ask anything about your documents..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
        disabled={loading}
      />
      <button
        onClick={submit}
        disabled={!value.trim() || loading}
        className="shrink-0 w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <svg
          className="w-4 h-4 rotate-90"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
          />
        </svg>
      </button>
    </div>
  );
}

// ============================================================
// FILE: src/components/Sidebar.jsx
// Left panel — branding + suggested questions
// ============================================================
function Sidebar({ onSuggest }) {
  const suggestions = [
    "What is the story about?",
    "What is the price of Ignisia Pro Suite?",
    "Summarize the key findings",
    "Are there any conflicting details?",
  ];

  return (
    <div className="w-64 shrink-0 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <span className="font-semibold text-gray-900 text-sm">Ignisia</span>
        </div>
        <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
          RAG-powered document assistant
        </p>
      </div>

      {/* Upload */}
      <UploadPanel />

      {/* Suggested questions */}
      <div className="px-4 py-4 flex-1 overflow-y-auto">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
          Suggested
        </p>
        <div className="space-y-1.5">
          {suggestions.map((q, i) => (
            <button
              key={i}
              onClick={() => onSuggest(q)}
              className="w-full text-left text-xs text-gray-600 px-3 py-2 rounded-lg hover:bg-white hover:text-indigo-600 hover:shadow-sm border border-transparent hover:border-gray-200 transition-all"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-gray-200">
        <p className="text-xs text-gray-400">Powered by Groq + LangGraph</p>
      </div>
    </div>
  );
}

// ============================================================
// FILE: src/pages/ChatPage.jsx
// Main page — wire Sidebar + MessageList + ChatInput together
// Move this to src/pages/ChatPage.jsx when adding React Router
// ============================================================

const API_URL = "http://localhost:5000/api/chat";

export default function App() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I'm your document assistant. Ask me anything about the files you've uploaded.",
      sources: [],
      conflicts: [],
      crmTicket: null,
    },
  ]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(question) {
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
          sources: data.sources || [],
          conflicts: data.conflicts || [],
          crmTicket: data.crmTicket || null,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Something went wrong: ${err.message}`,
          sources: [],
          conflicts: [],
          crmTicket: null,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <Sidebar onSuggest={sendMessage} />

      {/* Chat area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-sm font-semibold text-gray-900">
              Document Chat
            </h1>
            <p className="text-xs text-gray-400">
              Ask questions across all your ingested documents
            </p>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Live
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}
          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        <ChatInput onSend={sendMessage} loading={loading} />
      </div>
    </div>
  );
}

// ============================================================
// FILE: src/components/UploadPanel.jsx
// File upload panel shown in the sidebar
// ============================================================
function UploadPanel({ onUploadComplete }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  async function uploadFile(file) {
    setUploading(true);
    setResult(null);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      onUploadComplete?.(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  function handleChange(e) {
    const file = e.target.files[0];
    if (file) uploadFile(file);
  }

  return (
    <div className="px-4 py-4 border-t border-gray-200">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
        Upload Document
      </p>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
          dragging
            ? "border-indigo-400 bg-indigo-50"
            : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.xlsx,.xls,.eml,.txt"
          className="hidden"
          onChange={handleChange}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-indigo-600">Uploading & ingesting...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <svg
              className="w-6 h-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            <p className="text-xs text-gray-500">
              Drop file or click to upload
            </p>
            <p className="text-xs text-gray-400">PDF, Excel, Email</p>
          </div>
        )}
      </div>

      {/* Success */}
      {result && (
        <div className="mt-2 p-2 rounded-lg bg-green-50 border border-green-100">
          <p className="text-xs text-green-700 font-medium">✓ {result.file}</p>
          <p className="text-xs text-green-600">
            {result.chunks} chunks ingested
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-2 p-2 rounded-lg bg-red-50 border border-red-100">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
