import React, { useState, useEffect } from 'react';
import '../App.css'; // Will use same stylesheet but with new classes
import AuthScreen from './AuthScreen';
import ScrollStack, { ScrollStackItem } from './ScrollStack';

function IconBolt() {
  return (
    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function LandingPage({ onAuth }) {
  const [navOpen, setNavOpen] = useState(false);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    }, { threshold: 0.1 });
    // Observe all animated blocks
    document.querySelectorAll('.timeline-row, .workflow-header, .stacked-pane, .feature-card, .pricing-card, .section-reveal').forEach(el => revealObserver.observe(el));

    // Animate the vertical line as it enters view
    const lineObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('line-visible');
      });
    }, { threshold: 0.05 });
    document.querySelectorAll('.timeline-container').forEach(el => lineObserver.observe(el));

    return () => { revealObserver.disconnect(); lineObserver.disconnect(); };
  }, []);

  return (
    <div className="landing-root" id="landing-top">
      <video autoPlay loop muted playsInline className="background-video">
        <source src="/bg-video-2.mp4" type="video/mp4" />
      </video>
      <div className="landing-overlay"></div>
      
      <nav className="landing-nav glass-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div className="nav-brand" onClick={() => setNavOpen(v => !v)} style={{ cursor: 'pointer' }}>
            <div className="brand-logo-large"><IconBolt /></div>
            <span className="brand-name-large">Ignisia</span>
          </div>
          {/* Slide-in nav links next to logo on toggle */}
          <div className={`nav-inline-links ${navOpen ? 'nav-inline-open' : ''}`}>
            <span onClick={() => { scrollTo('workflow'); setNavOpen(false); }}>Workflow</span>
            <span onClick={() => { scrollTo('features'); setNavOpen(false); }}>Features</span>
            <span onClick={() => { scrollTo('pricing'); setNavOpen(false); }}>Pricing</span>
          </div>
        </div>
        <div className="nav-actions" style={{ gap: '16px', display: 'flex', alignItems: 'center' }}>
          <a href="#login" className="nav-signin-outline" style={{ textDecoration: "none" }}>Sign in</a>
          <a href="#login" className="nav-btn-gradient" style={{ textDecoration: "none" }}>Get started</a>
        </div>
      </nav>

      <main className="landing-main">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">
              Document intelligence that <br />
              <span className="text-gradient">is accurate by design.</span>
            </h1>
            <p className="hero-subtitle">
              Ignisia is the secure, B2B platform that verifies real context directly from your documents—replacing standard search and hallucinations with precision RAG.
            </p>
            <div className="hero-actions">
              <a href="#login" className="btn-primary-large" style={{ textDecoration: "none" }}>Start your journey &rarr;</a>
              <a href="#login" className="btn-secondary-large" style={{ textDecoration: "none" }}>Already have an account</a>
            </div>
          </div>
        </section>

        {/* Workflow Section */}
        <section className="timeline-section relative z-10" id="workflow">
          <div className="section-header text-center workflow-header" style={{ marginBottom: 100 }}>
            <h2 className="hero-title" style={{ fontSize: 48, marginBottom: 16 }}>Your journey with <span className="text-gradient">Ignisia</span></h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 18 }}>From document ingestion to verified business intelligence — here's how Ignisia works for you.</p>
          </div>

          <div className="timeline-container">
            {[
              {
                num: '01',
                emoji: '🔐',
                title: 'Multi-Tenant Data Isolation',
                colorClass: 'border-gold',
                desc: 'Securely partition your corporate knowledge. Log in with isolated workspaces so your proprietary documents never bleed across organizations.'
              },
              {
                num: '02',
                emoji: '📂',
                title: 'RAG Pipeline (PDF/Email Ingestion)',
                colorClass: 'border-cyan',
                desc: 'Upload complex PDFs or emails. The system autonomously chunks, embeds, and loads them into a fast vector search array for precision retrieval.'
              },
              {
                num: '03',
                emoji: '⚡',
                title: 'Algorithmic Conflict Detection',
                colorClass: 'border-purple',
                desc: '(Twist 1) The system actively scans overlapping topics. When an old quote contradicts a new policy, it explicitly reasons prioritizing the newer file.'
              },
              {
                num: '04',
                emoji: '🎟️',
                title: 'Autonomous CRM Ticket Generation',
                colorClass: 'border-orange',
                desc: '(Twist 2) When employees search client info, the agent seamlessly reverse-engineers the context and autonomously mounts a Support Ticket.'
              },
              {
                num: '05',
                emoji: '👥',
                title: 'Solo & Collaborative Workspaces',
                colorClass: 'border-green',
                desc: 'Operate independently in Solo Chat or generate shared Collaborative Rooms to query files in real-time alongside your team.'
              }
            ].map((step, idx) => (
              <div key={idx} className="timeline-row">
                <div className="timeline-item timeline-card-wrapper">
                  <div className={`timeline-card-glass ${step.colorClass}`}>
                    <h3>{step.emoji} {step.title}</h3>
                    <p>{step.desc}</p>
                  </div>
                </div>
                
                <div className="timeline-dot-wrapper">
                  <div className="timeline-dot">{step.num}</div>
                </div>

                <div className="timeline-spacer"></div>
              </div>
            ))}
          </div>
        </section>

        {/* Views Section */}
        <section className="views-section dark-grid-bg" id="solutions" style={{ padding: '100px 20px' }}>
          <div className="section-header section-reveal">
            <h2 className="hero-title" style={{ fontSize: 42 }}>Built for every level of the Enterprise</h2>
            <p className="section-label" style={{ marginTop: 12 }}>Scroll through the tailored ecosystem views modules seamlessly.</p>
          </div>

          <div className="stacked-views">
            <div className="stacked-pane">
              <h3 style={{ fontSize: 28, marginBottom: 12, color: "#fcd34d", fontFamily: "'Playfair Display', serif" }}>Solo Research Module</h3>
              <p style={{ color: "#f2f0eb" }}>Track personal document repositories, check sources, and conduct deep analysis individually without any background noise.</p>
            </div>
            <div className="stacked-pane">
              <h3 style={{ fontSize: 28, marginBottom: 12, color: "#fcd34d", fontFamily: "'Playfair Display', serif" }}>Group Collaboration Room</h3>
              <p style={{ color: "#f2f0eb" }}>Start real-time sessions, upload context into a shared drive, and query documents collaboratively with perfectly synchronized team AI responses.</p>
            </div>
            <div className="stacked-pane">
              <h3 style={{ fontSize: 28, marginBottom: 12, color: "#fcd34d", fontFamily: "'Playfair Display', serif" }}>Organization Console</h3>
              <p style={{ color: "#f2f0eb" }}>Secure global analytics, overseeing organizational document ingestion, maintaining security compliances, and unified knowledge base management.</p>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="features-section dark-grid-bg" id="features" style={{ padding: '100px 20px' }}>
          <div className="section-header section-reveal">
            <h2 className="hero-title" style={{ fontSize: 42 }}>Everything your organization needs in one unified platform.</h2>
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <h3 style={{ fontSize: 24, color: '#fcd34d', marginBottom: 16 }}>Smart RAG Engine</h3>
              <p style={{ color: "#f2f0eb", fontSize: 15, marginBottom: 20 }}>Real-time, context-bound query processing without manual sorting.</p>
              <ul className="feature-list" style={{ listStyle: 'none', padding: 0 }}>
                <li style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><IconCheck/> Live collaborative sessions</li>
                <li style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><IconCheck/> Organization-shared storage</li>
                <li style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><IconCheck/> Dynamic analyzing pathways</li>
              </ul>
            </div>
            
            <div className="feature-card">
              <h3 style={{ fontSize: 24, color: '#fcd34d', marginBottom: 16 }}>Accurate by Design</h3>
              <p style={{ color: "#f2f0eb", fontSize: 15, marginBottom: 20 }}>Built to prevent zero-context AI hallucinations.</p>
              <ul className="feature-list" style={{ listStyle: 'none', padding: 0 }}>
                <li style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><IconCheck/> Verified Page Citations</li>
                <li style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><IconCheck/> Document Conflict Detection</li>
                <li style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><IconCheck/> CRM Ticket Integrations</li>
              </ul>
            </div>

            <div className="feature-card">
              <h3 style={{ fontSize: 24, color: '#fcd34d', marginBottom: 16 }}>Secure & Compliant</h3>
              <p style={{ color: "#f2f0eb", fontSize: 15, marginBottom: 20 }}>Enterprise-grade security with privacy-first architecture.</p>
              <ul className="feature-list" style={{ listStyle: 'none', padding: 0 }}>
                <li style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><IconCheck/> No unauthorized tracking</li>
                <li style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><IconCheck/> Encrypted knowledge bases</li>
                <li style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><IconCheck/> On-prem deployment options</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Advanced Capabilities Section */}
        <section className="dark-grid-bg" id="advanced" style={{ padding: '100px 20px' }}>
          <div className="section-header section-reveal" style={{ textAlign: 'center', marginBottom: 72 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 16px', borderRadius: 20, background: 'rgba(217,119,87,0.1)', border: '1px solid rgba(217,119,87,0.25)', fontSize: 12, color: '#d97757', marginBottom: 20 }}>
              ⚡ What makes Ignisia different
            </div>
            <h2 className="hero-title" style={{ fontSize: 42 }}>Intelligence, not just search.</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 17, marginTop: 12, maxWidth: 580, margin: '12px auto 0' }}>
              Ignisia goes beyond keyword retrieval. It reasons, compares, and acts — turning your documents into a living knowledge system.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, maxWidth: 1100, margin: '0 auto' }}>
            {[
              { emoji: '🧠', title: 'Temporal Conflict Reasoning', desc: 'When two documents disagree, Ignisia doesn\'t pick randomly. It parses dates, identifies the authoritative source, and explicitly explains its decision to you.', badge: 'Twist 1' },
              { emoji: '🎫', title: 'Autonomous CRM Generation', desc: 'Every support query silently triggers a second AI process that synthesizes Issue, Context, and Resolution into a structured CRM ticket — zero human input needed.', badge: 'Twist 2' },
              { emoji: '🔐', title: 'Org-level Vector Isolation', desc: 'Your documents live in a private, scoped vector namespace. Other users on the same platform cannot retrieve, see, or access your data — ever.' },
              { emoji: '📊', title: 'Inline Chart Generation', desc: 'Ask for a bar chart or trend graph in natural language. The AI extracts numeric data from your documents and renders a live interactive visualization in chat.' },
              { emoji: '🤝', title: 'Real-time Collaborative Rooms', desc: 'Spawn a shared room with an invite code. Every team member asks questions simultaneously — the AI serves all of them from the same shared document context.' },
              { emoji: '📎', title: 'Multi-format Ingestion', desc: 'Drop in PDFs, Excel sheets, plain-text files, or raw email .eml files. The pipeline parses, chunks, and embeds every format into the vector store seamlessly.' },
            ].map((item, i) => (
              <div key={i} className="feature-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: '32px 28px', position: 'relative', transitionDelay: `${i * 70}ms` }}>
                {item.badge && (
                  <span style={{ position: 'absolute', top: 20, right: 20, padding: '3px 10px', borderRadius: 20, background: 'rgba(217,119,87,0.15)', border: '1px solid rgba(217,119,87,0.3)', fontSize: 11, fontWeight: 700, color: '#d97757' }}>{item.badge}</span>
                )}
                <div style={{ fontSize: 32, marginBottom: 16 }}>{item.emoji}</div>
                <h3 style={{ fontSize: 19, fontWeight: 700, color: '#f2f0eb', marginBottom: 10 }}>{item.title}</h3>
                <p style={{ fontSize: 14, color: 'rgba(242,240,235,0.5)', lineHeight: 1.75 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Login Section */}
        <section id="login" style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
          <AuthScreen onAuth={onAuth} />
        </section>

        {/* CTA */}
        <section className="cta-section" style={{ textAlign: "center", padding: "100px 20px" }}>
          <h2 style={{ fontSize: 32, marginBottom: 16 }}>Ready to modernize your knowledge?</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: 32 }}>Join organizations already using Ignisia to streamline their document intelligence.</p>
          <div className="cta-actions" style={{ display: 'flex', justifyContent: 'center' }}>
            <a href="#login" className="btn-primary-large" style={{ textDecoration: 'none' }}>Book a Demo</a>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="footer-cols">
          <div className="footer-col brand">
            <div className="nav-brand" style={{ marginBottom: 12 }}>
              <div className="brand-logo-large" style={{ width: 24, height: 24 }}><IconBolt /></div>
              <span className="brand-name-large" style={{ fontSize: 18 }}>Ignisia</span>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: 12 }}>© 2026 Ignisia. All rights reserved.</p>
          </div>
          <div className="footer-col">
            <h4>Product</h4>
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#demo">Demo</a>
          </div>
          <div className="footer-col">
            <h4>Solutions</h4>
            <a href="#solutions">For Individuals</a>
            <a href="#solutions">For Teams</a>
            <a href="#solutions">For Enterprise</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
