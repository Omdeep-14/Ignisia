import { useEffect, useState } from 'react';
import SplitText from './SplitText';

export default function WelcomeScreen({ name, onComplete }) {
  const [phase, setPhase] = useState(0); // 0=greeting, 1=subtitle fade, 2=done

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 800);
    const t2 = setTimeout(() => setPhase(2), 2600);
    const t3 = setTimeout(() => onComplete(), 3400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#0a0a0a',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: '"Söhne","Inter",ui-sans-serif,system-ui,sans-serif',
      overflow: 'hidden',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(217,119,87,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        {/* Small label */}
        <div style={{
          fontSize: 13, fontWeight: 500, letterSpacing: '0.12em', color: 'rgba(217,119,87,0.8)',
          textTransform: 'uppercase', marginBottom: 24,
          opacity: phase >= 0 ? 1 : 0,
          transition: 'opacity 0.6s ease',
        }}>
          Welcome to Ignisia
        </div>

        {/* Animated name */}
        <div style={{ fontSize: 'clamp(40px,7vw,80px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, color: '#f2f0eb' }}>
          <SplitText
            text={`Hello, ${name || 'there'}.`}
            tag="h1"
            className=""
            splitType="chars"
            delay={35}
            duration={1.1}
            ease="power4.out"
            from={{ opacity: 0, y: 50, rotateX: -40 }}
            to={{ opacity: 1, y: 0, rotateX: 0 }}
            threshold={0}
            rootMargin="0px"
            textAlign="center"
          />
        </div>

        {/* Subtitle */}
        <div style={{
          marginTop: 20, fontSize: 18, color: 'rgba(242,240,235,0.45)',
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 1 ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
        }}>
          Your document intelligence is ready.
        </div>

        {/* Loading bar */}
        <div style={{ marginTop: 48, width: 240, height: 1.5, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden', margin: '48px auto 0' }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #d97757, #fcd34d)',
            borderRadius: 2,
            width: phase >= 2 ? '100%' : phase >= 1 ? '60%' : '20%',
            transition: 'width 0.9s cubic-bezier(0.16,1,0.3,1)',
            boxShadow: '0 0 12px rgba(217,119,87,0.6)',
          }} />
        </div>
      </div>
    </div>
  );
}
