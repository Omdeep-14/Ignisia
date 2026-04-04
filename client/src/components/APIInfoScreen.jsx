import React, { useEffect, useState } from 'react';
import '../App.css';

function IconBolt() {
  return (<svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>);
}
function IconCode() {
  return (<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>);
}
function IconZap() {
  return (<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>);
}
function IconShield() {
  return (<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>);
}

const STEPS = [
  { num: '01', title: 'Authenticate & Get Token', desc: 'POST /api/auth/login with your credentials. You receive a JWT token scoped to your unique org_id which sandboxes your entire document namespace.' },
  { num: '02', title: 'Ingest Documents', desc: 'POST your PDFs, emails or Excel files to /api/upload. The pipeline auto-chunks, embeds via HuggingFace, and indexes them into MongoDB Atlas Vector Search.' },
  { num: '03', title: 'Query the RAG Pipeline', desc: 'POST to /api/chat. The LangGraph agent retrieves context from your vector store, runs conflict detection, generates the answer via Llama-3 on Groq, and synthesizes a CRM ticket.' },
  { num: '04', title: 'Consume Structured JSON', desc: 'Receive { answer, sources[], conflicts[], crmTicket } — plug directly into any SME SaaS dashboard, helpdesk, or customer portal.' },
];

const ENDPOINTS = [
  { method: 'POST', path: '/api/auth/signup', desc: 'Register a new user. Returns JWT + org_id for data isolation.' },
  { method: 'POST', path: '/api/auth/login', desc: 'Authenticate. Returns a signed JWT Bearer token.' },
  { method: 'POST', path: '/api/upload', desc: 'Upload a document (PDF/XLSX/EML/TXT). Accepts multipart/form-data.' },
  { method: 'POST', path: '/api/chat', desc: 'Ask a question. Returns answer, sources[], conflicts[], crmTicket.' },
  { method: 'GET',  path: '/api/uploads/list', desc: 'List all documents uploaded by the authenticated user.' },
  { method: 'POST', path: '/api/rooms/create', desc: 'Create a Collaborative Room. Returns invite code.' },
  { method: 'POST', path: '/api/rooms/:id/ask', desc: 'Send @ai message in a room. AI responds asynchronously.' },
];

const TECH_DETAILS = [
  {
    label: 'Vector Embeddings',
    chip: 'HuggingFace',
    detail: 'Documents are chunked (500 token chunks, 50 overlap) and embedded using HuggingFace sentence-transformers. Embeddings are stored in MongoDB Atlas with a cosine-similarity vector index.',
    code: `// Embedding pipeline (config.js)
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";
export const embeddings = new HuggingFaceTransformersEmbeddings({
  modelName: "Xenova/all-MiniLM-L6-v2"
});`
  },
  {
    label: 'RAG Graph (LangGraph)',
    chip: 'LangGraph',
    detail: 'The query pipeline is a stateful LangGraph DAG: retrieveNode → conflictNode → generateNode → crmNode. Each node is async and the graph persists conversation memory across requests via MemorySaver.',
    code: `// ragGraph.js pipeline nodes
graph.addNode("retrieve", retrieveNode);  // Vector search (k=60)
graph.addNode("conflict", conflictNode);  // Cross-doc contradiction scan
graph.addNode("generate", generateNode);  // Llama-3 via Groq
graph.addNode("crm", crmNode);            // Auto CRM ticket via LLM
graph.setEntryPoint("retrieve");`
  },
  {
    label: 'LLM (Groq + Llama-3)',
    chip: 'Groq',
    detail: 'Generation is handled by Llama-3-70b-8192 running on Groq inference infrastructure. The system prompt enforces strict RAG-only responses, explicit conflict reasoning, and JSON-structured CRM ticket generation.',
    code: `// config.js LLM setup
import { ChatGroq } from "@langchain/groq";
export const llm = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  apiKey: process.env.GROQ_API_KEY,
  temperature: 0
});`
  },
  {
    label: 'Multi-Tenant Isolation',
    chip: 'MongoDB Atlas',
    detail: 'Each user is assigned a random org_id (ObjectId) at signup. All vector store queries filter by org_id, so documents are cryptographically sandboxed — no cross-user retrieval is possible by design.',
    code: `// retrieveNode.js org filter
const results = await vectorStore.similaritySearch(
  question, 60,
  { preFilter: { org_id: { "$eq": org_id } } }
);`
  },
];

const PLANS = [
  {
    name: 'Pilot', price: '₹1,299', period: '/mo', desc: 'For single teams or trials.',
    features: ['1 Admin Account', 'Up to 10 Users', 'RAG Document Retrieval', 'Solo Chat Interface', 'Email Support'],
  },
  {
    name: 'Organization', price: '₹4,999', period: '/mo', desc: 'For mid-size companies.', popular: true,
    features: ['Unlimited AI Usage', 'Collaborative Rooms', 'Conflict Detection Engine', 'Auto CRM Ticket Generation', 'Priority Support'],
  },
  {
    name: 'Enterprise', price: '₹9,999', period: '/mo', desc: 'For large corporations.',
    features: ['Everything in Organization', 'Multi-Tenant Data Isolation', 'Custom Integrations', 'Dedicated Account Manager', 'On-premise Deployment'],
  },
];

export default function APIInfoScreen({ onEnter, onBack }) {
  const [docsOpen, setDocsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  // checkout: null | 'company' | 'processing' | 'success'
  const [checkoutStep, setCheckoutStep] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [companyForm, setCompanyForm] = useState({ companyName:'', industry:'', website:'', employees:'', contactName:'', email:'', phone:'', useCase:'' });
  const [formErrors, setFormErrors] = useState({});

  function openCheckout(plan) { setSelectedPlan(plan); setCheckoutStep('company'); setFormErrors({}); }
  function closeCheckout() { setCheckoutStep(null); setSelectedPlan(null); setFormErrors({}); }

  function validateCompany() {
    const e = {};
    if (!companyForm.companyName.trim()) e.companyName = 'Required';
    if (!companyForm.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(companyForm.email)) e.email = 'Valid email required';
    if (!companyForm.contactName.trim()) e.contactName = 'Required';
    if (!companyForm.website.trim()) e.website = 'Required';
    setFormErrors(e); return Object.keys(e).length === 0;
  }

  function submitCompany() {
    if (validateCompany()) {
      setCheckoutStep('processing');
      setTimeout(() => setCheckoutStep('success'), 3000);
    }
  }

  const STEP_LABELS = ['Company Info', 'Processing', 'Done'];
  const stepIdx = { company:0, processing:1, success:2 };
  const inp = (err) => ({ width:'100%', padding:'11px 14px', borderRadius:9, background:'rgba(255,255,255,0.04)', border:`1.5px solid ${err ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`, color:'#f2f0eb', fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:'inherit' });
  const lbl = { fontSize:12, fontWeight:600, color:'rgba(242,240,235,0.5)', letterSpacing:'0.05em', marginBottom:6, display:'block' };
  const errTxt = { fontSize:11, color:'#f87171', marginTop:3 };


  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.08 });
    document.querySelectorAll('.api-reveal').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [docsOpen]);

  const S = {
    bg: { minHeight: '100vh', background: '#0a0a0a', color: '#f2f0eb', fontFamily: '"Söhne","Inter",ui-sans-serif,system-ui,sans-serif', overflowX: 'hidden' },
    section: { maxWidth: 940, margin: '0 auto', padding: '0 24px' },
    card: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '28px 32px' },
  };


  return (
    <div style={S.bg}>
      {/* Sticky Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 40px', background: 'rgba(10,10,10,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#d97757,#c96040)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><IconBolt /></div>
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>Ignisia <span style={{ color: '#d97757' }}>API</span></span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {onBack && (
            <button onClick={onBack} style={{ padding: '9px 20px', borderRadius: 8, background: 'transparent', border: '1.5px solid rgba(255,255,255,0.1)', color: 'rgba(242,240,235,0.5)', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Back to Bot
            </button>
          )}
          <button onClick={() => setDocsOpen(v => !v)} style={{ padding: '9px 20px', borderRadius: 8, background: 'transparent', border: '1.5px solid rgba(252,211,77,0.35)', color: '#fcd34d', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            {docsOpen ? 'Hide Tech Docs' : 'View API Docs'}
          </button>
          <button onClick={onEnter} style={{ padding: '9px 20px', borderRadius: 8, background: 'linear-gradient(135deg,#d97757,#c96040)', border: 'none', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            Launch App →
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '90px 24px 70px', maxWidth: 820, margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 20, background: 'rgba(217,119,87,0.12)', border: '1px solid rgba(217,119,87,0.3)', fontSize: 13, color: '#d97757', marginBottom: 28 }}>
          <IconCode /> SME Integration Guide
        </div>
        <h1 style={{ fontSize: 'clamp(36px,5vw,56px)', fontWeight: 800, lineHeight: 1.12, marginBottom: 20, letterSpacing: '-0.03em' }}>
          Embed Ignisia into <br />
          <span style={{ background: 'linear-gradient(135deg,#d97757,#fcd34d)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>your SME platform</span>
        </h1>
        <p style={{ fontSize: 17, color: 'rgba(242,240,235,0.55)', lineHeight: 1.75, marginBottom: 40 }}>
          Ignisia exposes a clean REST API. Any SME, SaaS app, or internal tool can query documents, detect conflicts, and generate CRM tickets — without building any AI infrastructure.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={onEnter} style={{ padding: '13px 30px', borderRadius: 10, background: 'linear-gradient(135deg,#d97757,#c96040)', border: '2px solid rgba(217,119,87,0.7)', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
            Try the AI Bot →
          </button>
          <button onClick={() => { setDocsOpen(true); setTimeout(() => document.getElementById('tech-docs')?.scrollIntoView({ behavior: 'smooth' }), 100); }}
            style={{ padding: '13px 30px', borderRadius: 10, background: 'transparent', border: '2px solid rgba(252,211,77,0.35)', color: '#fcd34d', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
            View API Docs ↓
          </button>
        </div>
      </section>

      {/* Stats */}
      <div className="api-reveal" style={{ display: 'flex', justifyContent: 'center', gap: 60, padding: '36px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 80, flexWrap: 'wrap' }}>
        {[['< 200ms','Avg Response'],['Llama-3','LLM Engine'],['6 Endpoints','Clean REST API'],['org_id','Isolated Tenants']].map(([v,l]) => (
          <div key={l} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#fcd34d', letterSpacing: '-0.02em' }}>{v}</div>
            <div style={{ fontSize: 12, color: 'rgba(242,240,235,0.45)', marginTop: 4 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Steps */}
      <section style={{ ...S.section, paddingBottom: 100 }}>
        <div className="api-reveal" style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontSize: 34, fontWeight: 800, marginBottom: 10 }}>Integrate in <span style={{ color: '#d97757' }}>4 steps</span></h2>
          <p style={{ color: 'rgba(242,240,235,0.45)', fontSize: 15 }}>No LLM knowledge required. Just REST calls.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: 18 }}>
          {STEPS.map((s, i) => (
            <div key={i} className="api-reveal" style={{ ...S.card, transitionDelay: `${i * 80}ms` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#d97757', letterSpacing: '0.12em', marginBottom: 12 }}>{s.num}</div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>{s.title}</h3>
              <p style={{ color: 'rgba(242,240,235,0.5)', fontSize: 14, lineHeight: 1.7 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Endpoints */}
      <section style={{ ...S.section, paddingBottom: 100 }}>
        <div className="api-reveal" style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 30, fontWeight: 800, marginBottom: 8 }}>Available <span style={{ color: '#d97757' }}>Endpoints</span></h2>
          <p style={{ color: 'rgba(242,240,235,0.45)', fontSize: 14 }}>All requests require Bearer token from POST /api/auth/login.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ENDPOINTS.map((ep, i) => (
            <div key={i} className="api-reveal" style={{ display: 'flex', alignItems: 'flex-start', gap: 18, ...S.card, padding: '16px 22px', transitionDelay: `${i * 50}ms` }}>
              <span style={{ flexShrink: 0, padding: '3px 9px', borderRadius: 5, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', background: ep.method === 'GET' ? 'rgba(100,200,120,0.12)' : 'rgba(217,119,87,0.12)', color: ep.method === 'GET' ? '#6dc87d' : '#d97757', border: `1px solid ${ep.method === 'GET' ? 'rgba(100,200,120,0.25)' : 'rgba(217,119,87,0.25)'}` }}>{ep.method}</span>
              <div>
                <code style={{ fontSize: 13, color: '#fcd34d', fontFamily: 'monospace' }}>{ep.path}</code>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(242,240,235,0.45)' }}>{ep.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Technical Docs Panel — shown only when docsOpen */}
      {docsOpen && (
        <section id="tech-docs" style={{ ...S.section, paddingBottom: 120 }}>
          <div className="api-reveal" style={{ marginBottom: 44 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 20, background: 'rgba(252,211,77,0.08)', border: '1px solid rgba(252,211,77,0.2)', fontSize: 12, color: '#fcd34d', marginBottom: 16 }}>
              🔧 Technical Architecture
            </div>
            <h2 style={{ fontSize: 34, fontWeight: 800, marginBottom: 10 }}>How the AI is <span style={{ color: '#d97757' }}>actually built</span></h2>
            <p style={{ color: 'rgba(242,240,235,0.45)', fontSize: 15 }}>Internals of the RAG pipeline, embedding layer, LLM integration, and data isolation.</p>
          </div>

          {/* Tab selector */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
            {TECH_DETAILS.map((t, i) => (
              <button key={i} onClick={() => setActiveTab(i)} style={{ padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: activeTab === i ? 'rgba(217,119,87,0.2)' : 'rgba(255,255,255,0.04)', border: `1px solid ${activeTab === i ? 'rgba(217,119,87,0.5)' : 'rgba(255,255,255,0.08)'}`, color: activeTab === i ? '#d97757' : 'rgba(242,240,235,0.6)', transition: 'all 0.2s ease' }}>
                {t.chip}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {TECH_DETAILS.map((t, i) => i === activeTab && (
            <div key={i} className="api-reveal" style={{ ...S.card }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ padding: '4px 12px', borderRadius: 6, background: 'rgba(217,119,87,0.15)', border: '1px solid rgba(217,119,87,0.3)', fontSize: 12, fontWeight: 700, color: '#d97757', letterSpacing: '0.06em' }}>{t.chip}</span>
                <h3 style={{ fontSize: 18, fontWeight: 700 }}>{t.label}</h3>
              </div>
              <p style={{ color: 'rgba(242,240,235,0.6)', fontSize: 14, lineHeight: 1.75, marginBottom: 24 }}>{t.detail}</p>
              <div style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '20px 24px', fontFamily: '"Fira Code","Cascadia Code",monospace', fontSize: 12.5, lineHeight: 1.8, color: '#a3e4a3', overflowX: 'auto', whiteSpace: 'pre' }}>
                {t.code}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Pillars */}
      <section className="api-reveal" style={{ ...S.section, paddingBottom: 100 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 18 }}>
          {[[IconZap,'Precision RAG','Embedding-based retrieval across your org\'s documents, not keyword search.'],[IconShield,'Data Isolation','Each org_id creates a private namespace. Docs never cross user boundaries.'],[IconCode,'No AI Setup','Just call our API. We manage the vector store, embeddings, and LLM routing.']].map(([Icon,title,desc],i)=>(
            <div key={i} style={{ ...S.card }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(217,119,87,0.1)', border: '1px solid rgba(217,119,87,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97757', marginBottom: 16 }}><Icon /></div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{title}</h3>
              <p style={{ fontSize: 13, color: 'rgba(242,240,235,0.45)', lineHeight: 1.65 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section style={{ ...S.section, paddingBottom: 100, paddingTop: 20 }}>
        <div className="api-reveal" style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 16px', borderRadius: 20, background: 'rgba(217,119,87,0.1)', border: '1px solid rgba(217,119,87,0.25)', fontSize: 12, color: '#d97757', marginBottom: 20 }}>
            💳 Choose your plan
          </div>
          <h2 style={{ fontSize: 34, fontWeight: 800, marginBottom: 10 }}>Start building with <span style={{ color: '#d97757' }}>Ignisia</span></h2>
          <p style={{ color: 'rgba(242,240,235,0.45)', fontSize: 15 }}>All plans include full API access. Cancel anytime.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(270px,1fr))', gap: 20 }}>
          {PLANS.map((plan, i) => (
            <div key={i} className="api-reveal" style={{ position: 'relative', ...S.card, border: plan.popular ? '1.5px solid rgba(217,119,87,0.5)' : '1px solid rgba(255,255,255,0.07)', transitionDelay: `${i * 80}ms` }}>
              {plan.popular && (
                <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', padding: '3px 16px', borderRadius: 20, background: 'linear-gradient(135deg,#d97757,#c96040)', fontSize: 11, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>Most Popular</div>
              )}
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>{plan.name}</h3>
              <p style={{ fontSize: 13, color: 'rgba(242,240,235,0.45)', marginBottom: 20 }}>{plan.desc}</p>
              <div style={{ marginBottom: 24 }}>
                <span style={{ fontSize: 40, fontWeight: 800, color: '#fcd34d' }}>{plan.price}</span>
                <span style={{ fontSize: 14, color: 'rgba(242,240,235,0.4)' }}>{plan.period}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                {plan.features.map((f, fi) => (
                  <div key={fi} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: 'rgba(242,240,235,0.65)' }}>
                    <svg width="14" height="14" fill="none" stroke="#d97757" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    {f}
                  </div>
                ))}
              </div>
              <button
                onClick={() => openCheckout(plan)}
                style={{ width: '100%', padding: '12px 0', borderRadius: 10, background: plan.popular ? 'linear-gradient(135deg,#d97757,#c96040)' : 'transparent', border: plan.popular ? '2px solid rgba(217,119,87,0.7)' : '1.5px solid rgba(255,255,255,0.14)', color: plan.popular ? '#fff' : 'rgba(242,240,235,0.75)', fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s ease' }}
                onMouseEnter={e => { if (!plan.popular) { e.currentTarget.style.borderColor='rgba(217,119,87,0.5)'; e.currentTarget.style.color='#d97757'; }}}
                onMouseLeave={e => { if (!plan.popular) { e.currentTarget.style.borderColor='rgba(255,255,255,0.14)'; e.currentTarget.style.color='rgba(242,240,235,0.75)'; }}}
              >
                {plan.popular ? 'Get Started →' : `Choose ${plan.name} →`}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── Checkout Modal ─────────────────────────────────────────────────── */}
      {checkoutStep && (
        <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.8)', backdropFilter:'blur(14px)', padding:20 }}>
          <div style={{ background:'#111', border:'1px solid rgba(255,255,255,0.1)', borderRadius:24, width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto', position:'relative' }}>

            {/* Close button */}
            {checkoutStep !== 'processing' && (
              <button onClick={closeCheckout} style={{ position:'absolute', top:16, right:16, background:'transparent', border:'none', color:'rgba(242,240,235,0.3)', fontSize:20, cursor:'pointer', lineHeight:1 }}>✕</button>
            )}

            {/* Step progress bar */}
            {checkoutStep !== 'success' && (
              <div style={{ display:'flex', gap:4, padding:'24px 32px 0' }}>
                {STEP_LABELS.map((l, i) => (
                  <div key={i} style={{ flex:1, textAlign:'center' }}>
                    <div style={{ height:3, borderRadius:2, background: i <= (stepIdx[checkoutStep] ?? 0) ? '#d97757' : 'rgba(255,255,255,0.1)', transition:'background 0.3s' }} />
                    <div style={{ fontSize:10, marginTop:5, color: i <= (stepIdx[checkoutStep] ?? 0) ? '#d97757' : 'rgba(242,240,235,0.25)', fontWeight:600 }}>{l}</div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ padding:'28px 32px 36px' }}>

              {/* ── STEP 1: Company Info ────────────────────────────────── */}
              {checkoutStep === 'company' && (
                <>
                  <div style={{ marginBottom:24 }}>
                    <h3 style={{ fontSize:20, fontWeight:800, marginBottom:6 }}>Company Details</h3>
                    <p style={{ fontSize:13, color:'rgba(242,240,235,0.45)' }}>
                      Selected plan: <strong style={{ color:'#fcd34d' }}>{selectedPlan?.name} — {selectedPlan?.price}/mo</strong>
                    </p>
                  </div>

                  {/* Security notice */}
                  <div style={{ display:'flex', gap:12, alignItems:'flex-start', background:'rgba(100,180,120,0.08)', border:'1px solid rgba(100,180,120,0.2)', borderRadius:12, padding:'14px 16px', marginBottom:24 }}>
                    <span style={{ fontSize:18, flexShrink:0 }}>🔒</span>
                    <div>
                      <div style={{ fontSize:12, fontWeight:700, color:'#6dc87d', letterSpacing:'0.05em', marginBottom:4 }}>DATA SECURITY NOTICE</div>
                      <div style={{ fontSize:12, color:'rgba(242,240,235,0.5)', lineHeight:1.65 }}>
                        We collect your company information <strong style={{ color:'rgba(242,240,235,0.75)' }}>for verification and security purposes only</strong>. Your data is encrypted, never sold to third parties, and stored in compliance with data protection regulations. You can request deletion anytime.
                      </div>
                    </div>
                  </div>

                  {/* Form grid */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                    <div>
                      <label style={lbl}>COMPANY NAME *</label>
                      <input style={inp(formErrors.companyName)} value={companyForm.companyName} onChange={e => setCompanyForm(p=>({...p, companyName:e.target.value}))} placeholder="Acme Corp" />
                      {formErrors.companyName && <div style={errTxt}>{formErrors.companyName}</div>}
                    </div>
                    <div>
                      <label style={lbl}>INDUSTRY</label>
                      <select style={{...inp(false), appearance:'none'}} value={companyForm.industry} onChange={e => setCompanyForm(p=>({...p, industry:e.target.value}))}>
                        <option value="">Select…</option>
                        {['Technology','Finance','Healthcare','Legal','Manufacturing','Retail','Education','Other'].map(s=><option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>WEBSITE *</label>
                      <input style={inp(formErrors.website)} value={companyForm.website} onChange={e => setCompanyForm(p=>({...p, website:e.target.value}))} placeholder="https://acme.com" />
                      {formErrors.website && <div style={errTxt}>{formErrors.website}</div>}
                    </div>
                    <div>
                      <label style={lbl}>NO. OF EMPLOYEES</label>
                      <select style={{...inp(false), appearance:'none'}} value={companyForm.employees} onChange={e => setCompanyForm(p=>({...p, employees:e.target.value}))}>
                        <option value="">Select…</option>
                        {['1–10','11–50','51–200','201–1000','1000+'].map(s=><option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>CONTACT PERSON *</label>
                      <input style={inp(formErrors.contactName)} value={companyForm.contactName} onChange={e => setCompanyForm(p=>({...p, contactName:e.target.value}))} placeholder="Jane Smith" />
                      {formErrors.contactName && <div style={errTxt}>{formErrors.contactName}</div>}
                    </div>
                    <div>
                      <label style={lbl}>BUSINESS EMAIL *</label>
                      <input type="email" style={inp(formErrors.email)} value={companyForm.email} onChange={e => setCompanyForm(p=>({...p, email:e.target.value}))} placeholder="jane@acme.com" />
                      {formErrors.email && <div style={errTxt}>{formErrors.email}</div>}
                    </div>
                    <div>
                      <label style={lbl}>PHONE</label>
                      <input style={inp(false)} value={companyForm.phone} onChange={e => setCompanyForm(p=>({...p, phone:e.target.value}))} placeholder="+91 98765 43210" />
                    </div>
                    <div>
                      <label style={lbl}>PRIMARY USE CASE</label>
                      <select style={{...inp(false), appearance:'none'}} value={companyForm.useCase} onChange={e => setCompanyForm(p=>({...p, useCase:e.target.value}))}>
                        <option value="">Select…</option>
                        {['Customer Support','Internal Knowledge Base','Contract Analysis','Sales Intelligence','Compliance & Legal','Other'].map(s=><option key={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ display:'flex', gap:12, marginTop:28 }}>
                    <button onClick={closeCheckout} style={{ flex:1, padding:'12px 0', borderRadius:10, background:'transparent', border:'1.5px solid rgba(255,255,255,0.1)', color:'rgba(242,240,235,0.45)', fontWeight:600, fontSize:14, cursor:'pointer' }}>Cancel</button>
                    <button onClick={submitCompany} style={{ flex:2, padding:'12px 0', borderRadius:10, background:'linear-gradient(135deg,#d97757,#c96040)', border:'none', color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer' }}>Activate {selectedPlan?.name} Plan →</button>
                  </div>
                </>
              )}

              {/* ── STEP 2: Processing ──────────────────────────────────── */}
              {checkoutStep === 'processing' && (
                <div style={{ textAlign:'center', padding:'20px 0' }}>
                  <div style={{ width:80, height:80, borderRadius:'50%', background:'rgba(217,119,87,0.1)', border:'2px solid rgba(217,119,87,0.3)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 28px', animation:'spin 1.4s linear infinite' }}>
                    <svg width="36" height="36" fill="none" stroke="#d97757" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                  </div>
                  <h3 style={{ fontSize:22, fontWeight:800, marginBottom:10 }}>Processing Payment</h3>
                  <p style={{ color:'rgba(242,240,235,0.45)', fontSize:14, marginBottom:28 }}>
                    Confirming <strong style={{ color:'#fcd34d' }}>{selectedPlan?.name}</strong> plan for <strong style={{ color:'rgba(242,240,235,0.7)' }}>{companyForm.companyName}</strong>…
                  </p>
                  <div style={{ display:'flex', justifyContent:'center', gap:10 }}>
                    {[0,1,2].map(d => <div key={d} style={{ width:9, height:9, borderRadius:'50%', background:'#d97757', animation:`bounce 1.2s ease-in-out ${d*0.2}s infinite` }} />)}
                  </div>
                  <p style={{ marginTop:28, fontSize:11, color:'rgba(242,240,235,0.2)' }}>🔒 256-bit SSL · PCI-DSS compliant demo gateway</p>
                </div>
              )}

              {/* ── STEP 3: Success ─────────────────────────────────────── */}
              {checkoutStep === 'success' && (
                <div style={{ textAlign:'center', padding:'12px 0' }}>
                  <div style={{ width:84, height:84, borderRadius:'50%', background:'rgba(109,200,125,0.12)', border:'2px solid rgba(109,200,125,0.4)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 28px' }}>
                    <svg width="40" height="40" fill="none" stroke="#6dc87d" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <h3 style={{ fontSize:24, fontWeight:800, marginBottom:8 }}>Payment Confirmed! 🎉</h3>
                  <p style={{ color:'rgba(242,240,235,0.55)', fontSize:14, marginBottom:6 }}>
                    Welcome to the <strong style={{ color:'#fcd34d' }}>{selectedPlan?.name}</strong> plan.
                  </p>
                  <p style={{ color:'rgba(242,240,235,0.35)', fontSize:13, marginBottom:8 }}>
                    A confirmation has been sent to <strong style={{ color:'rgba(242,240,235,0.6)' }}>{companyForm.email}</strong>.
                  </p>
                  <p style={{ color:'rgba(242,240,235,0.3)', fontSize:12, marginBottom:36 }}>
                    {companyForm.companyName}'s workspace is provisioned and ready.
                  </p>
                  <button onClick={onEnter} style={{ width:'100%', padding:'15px 0', borderRadius:12, background:'linear-gradient(135deg,#d97757,#c96040)', border:'2px solid rgba(217,119,87,0.7)', color:'#fff', fontWeight:700, fontSize:16, cursor:'pointer', boxShadow:'0 6px 24px rgba(217,119,87,0.45)' }}>
                    🚀 Launch AI Bot →
                  </button>
                  <button onClick={closeCheckout} style={{ marginTop:14, background:'transparent', border:'none', color:'rgba(242,240,235,0.25)', fontSize:12, cursor:'pointer' }}>
                    ← Back to plans
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bounce { 0%,80%,100% { transform:scale(0.6);opacity:0.4 } 40% { transform:scale(1);opacity:1 } }
        input::placeholder, textarea::placeholder { color: rgba(242,240,235,0.25); }
        select option { background: #1a1a1a; color: #f2f0eb; }
      `}</style>

      {/* Final CTA */}
      <section style={{ textAlign:'center', padding:'40px 24px 100px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
        <p style={{ color:'rgba(242,240,235,0.3)', fontSize:14 }}>Already have access? Skip directly to the bot.</p>
        <button onClick={onEnter} style={{ marginTop:16, padding:'12px 32px', borderRadius:10, background:'transparent', border:'1.5px solid rgba(255,255,255,0.1)', color:'rgba(242,240,235,0.5)', fontWeight:600, fontSize:14, cursor:'pointer' }}>
          Launch AI Bot without plan →
        </button>
      </section>
    </div>
  );
}




