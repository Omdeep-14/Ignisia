import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError("");
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (displayName.trim()) {
          await supabase.from("profiles")
            .update({ display_name: displayName.trim() })
            .eq("id", data.user.id);
        }
        onAuth(data.session);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuth(data.session);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.root}>
      {/* Subtle grid pattern overlay */}
      <div style={styles.gridOverlay} />

      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoWrap}>
          <div style={styles.logoIcon}>
            <svg width="20" height="20" fill="none" stroke="#fff" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 style={styles.logoName}>Ignisia</h1>
        </div>
        <p style={styles.tagline}>
          {mode === "login" ? "Welcome back to your workspace" : "Create your organisation workspace"}
        </p>

        {/* Tab switcher */}
        <div style={styles.tabs}>
          {["login", "signup"].map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); }}
              style={{
                ...styles.tab,
                ...(mode === m ? styles.tabActive : {}),
              }}
            >
              {m === "login" ? "Sign in" : "Sign up"}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div style={styles.fields}>
          {mode === "signup" && (
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Display name</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Alex Chen"
                style={styles.input}
                onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
                onBlur={e => Object.assign(e.target.style, { borderColor: "rgba(255,255,255,0.1)", boxShadow: "none" })}
              />
            </div>
          )}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Work email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="alex@acme.com"
              style={styles.input}
              onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
              onBlur={e => Object.assign(e.target.style, { borderColor: "rgba(255,255,255,0.1)", boxShadow: "none" })}
            />
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              style={styles.input}
              onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
              onBlur={e => Object.assign(e.target.style, { borderColor: "rgba(255,255,255,0.1)", boxShadow: "none" })}
            />
          </div>
        </div>

        {error && (
          <div style={styles.errorBox}>
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !email || !password}
          style={{
            ...styles.submitBtn,
            ...(loading || !email || !password ? styles.submitDisabled : {}),
          }}
          onMouseEnter={e => { if (!loading && email && password) Object.assign(e.target.style, styles.submitHover); }}
          onMouseLeave={e => Object.assign(e.target.style, { background: "#d97757", transform: "none", boxShadow: "0 2px 12px rgba(217,119,87,0.3)" })}
        >
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              Please wait…
            </span>
          ) : mode === "login" ? "Sign in to workspace" : "Create account"}
        </button>

        {mode === "signup" && (
          <p style={styles.hint}>
            Your work email domain determines your organisation. Everyone from the same domain joins the same workspace automatically.
          </p>
        )}
      </div>

      {/* Footer */}
      <p style={styles.footer}>
        Secured by enterprise-grade encryption · B2B Document Intelligence
      </p>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        .auth-card { animation: fadeUp 0.4s cubic-bezier(0.34,1.56,0.64,1); }
      `}</style>
    </div>
  );
}

const styles = {
  root: {
    minHeight: "100vh",
    background: "#0d0d0d",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    fontFamily: "'Inter', -apple-system, sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  gridOverlay: {
    position: "fixed",
    inset: 0,
    backgroundImage: `
      linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
    `,
    backgroundSize: "40px 40px",
    pointerEvents: "none",
    zIndex: 0,
  },
  card: {
    position: "relative",
    zIndex: 1,
    width: "100%",
    maxWidth: "400px",
    background: "#161616",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "20px",
    padding: "36px",
    boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
    animation: "fadeUp 0.4s cubic-bezier(0.34,1.56,0.64,1)",
  },
  logoWrap: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "6px",
  },
  logoIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #d97757, #b85f3a)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 16px rgba(217,119,87,0.35)",
    flexShrink: 0,
  },
  logoName: {
    fontSize: "22px",
    fontWeight: 700,
    color: "#f2f0eb",
    letterSpacing: "-0.02em",
  },
  tagline: {
    fontSize: "13px",
    color: "#6b6963",
    marginBottom: "28px",
    marginTop: "2px",
  },
  tabs: {
    display: "flex",
    background: "#0d0d0d",
    borderRadius: "10px",
    padding: "3px",
    marginBottom: "24px",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  tab: {
    flex: 1,
    padding: "8px",
    borderRadius: "8px",
    border: "none",
    background: "transparent",
    color: "#6b6963",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s ease",
    fontFamily: "'Inter', sans-serif",
  },
  tabActive: {
    background: "#1e1e1e",
    color: "#f2f0eb",
    boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
  },
  fields: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    marginBottom: "20px",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "11.5px",
    fontWeight: 500,
    color: "#6b6963",
    letterSpacing: "0.02em",
  },
  input: {
    background: "#0d0d0d",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    padding: "11px 14px",
    color: "#f2f0eb",
    fontSize: "13.5px",
    fontFamily: "'Inter', sans-serif",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    width: "100%",
  },
  inputFocus: {
    borderColor: "rgba(217,119,87,0.5)",
    boxShadow: "0 0 0 3px rgba(217,119,87,0.1)",
  },
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    padding: "10px 12px",
    borderRadius: "9px",
    background: "rgba(248,113,113,0.08)",
    border: "1px solid rgba(248,113,113,0.2)",
    color: "#f87171",
    fontSize: "12px",
    marginBottom: "16px",
  },
  submitBtn: {
    width: "100%",
    padding: "12px",
    borderRadius: "11px",
    border: "none",
    background: "#d97757",
    color: "#fff",
    fontSize: "13.5px",
    fontWeight: 600,
    fontFamily: "'Inter', sans-serif",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 2px 12px rgba(217,119,87,0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  submitHover: {
    background: "#c96848",
    transform: "translateY(-1px)",
    boxShadow: "0 4px 18px rgba(217,119,87,0.45)",
  },
  submitDisabled: {
    opacity: 0.4,
    cursor: "not-allowed",
    transform: "none",
  },
  hint: {
    marginTop: "16px",
    fontSize: "11.5px",
    color: "#3d3b38",
    textAlign: "center",
    lineHeight: 1.6,
  },
  footer: {
    position: "relative",
    zIndex: 1,
    marginTop: "28px",
    fontSize: "11px",
    color: "#3d3b38",
    textAlign: "center",
  },
};
