import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform, useInView, animate } from 'framer-motion';
import { Gavel, ChevronRight, Play, Lock, Eye, Trophy, ArrowRight } from 'lucide-react';
import { getPlatformStats } from '../lib/supabase';
import { weiToEth } from '../lib/crypto';

// Reusable 3D Tilt Button
const AnimatedCounter = ({ value }: { value: string }) => {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(nodeRef, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!isInView || !nodeRef.current || value === '—') return;
    const match = value.match(/^([\d.]+)(.*)$/);
    if (match) {
      const num = parseFloat(match[1]);
      const suffix = match[2];
      const isInteger = num % 1 === 0 && !match[1].includes('.');
      const decimals = match[1].includes('.') ? match[1].split('.')[1].length : 0;
      animate(0, num, {
        duration: 2,
        ease: "easeOut",
        onUpdate: (v) => {
          if (nodeRef.current) nodeRef.current.textContent = (isInteger ? Math.round(v) : v.toFixed(decimals)) + suffix;
        }
      });
    } else {
      if (nodeRef.current) nodeRef.current.textContent = value;
    }
  }, [value, isInView]);

  return <span ref={nodeRef}>{value === '—' ? '—' : '0'}</span>;
};

const TiltButton: React.FC<{ children: React.ReactNode; onClick?: () => void; primary?: boolean; className?: string }> = ({ children, onClick, primary = true, className }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 20 });
  const rotateX = useTransform(mouseYSpring, [-50, 50], [15, -15]);
  const rotateY = useTransform(mouseXSpring, [-50, 50], [-15, 15]);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      style={{
        perspective: 1000,
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        background: primary ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' : 'transparent',
        border: primary ? 'none' : '1px solid rgba(var(--text-rgb), 0.2)',
        borderRadius: 12,
        padding: '15px 32px',
        fontFamily: 'Outfit, sans-serif',
        fontWeight: 700,
        fontSize: '1rem',
        color: primary ? 'var(--btn-text)' : 'var(--text-primary)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        boxShadow: primary 
          ? '0 10px 30px rgba(var(--accent-primary-rgb), 0.3), inset 0 2px 0 rgba(255,255,255,0.2)' 
          : '0 4px 15px rgba(0,0,0,0.1)',
        position: 'relative'
      }}
      className={className}
    >
      <div style={{ transform: 'translateZ(20px)', display: 'flex', alignItems: 'center', gap: 8 }}>
        {children}
      </div>
    </motion.button>
  );
};

const HeroVideo: React.FC = () => {
  const [frame, setFrame] = useState(1);
  useEffect(() => {
    for (let i = 1; i <= 40; i++) {
      const img = new Image();
      img.src = `/coin_img/ezgif-frame-${i.toString().padStart(3, '0')}.jpg`;
    }
    let f = 1;
    const interval = setInterval(() => {
      f = f >= 40 ? 1 : f + 1;
      setFrame(f);
    }, 1000 / 24);
    return () => clearInterval(interval);
  }, []);

  return <img src={`/coin_img/ezgif-frame-${frame.toString().padStart(3, '0')}.jpg`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} alt="hero" />;
};

const steps = [
  { icon: Eye, title: 'Discover', description: 'Browse premium digital assets and exclusive NFT drops on the Aura Decrypto platform.', color: 'var(--accent-secondary)', rgb: 'var(--accent-secondary-rgb)' },
  { icon: Trophy, title: 'Bid Live', description: 'Place your bids in real-time. Watch the competition heat up as the timer counts down.', color: 'var(--accent-primary)', rgb: 'var(--accent-primary-rgb)' },
  { icon: Lock, title: 'Secure Win', description: 'Winners are determined instantly on-chain. Smart contracts ensure fair play and instant refunds.', color: 'var(--warning)', rgb: 'var(--warning-rgb)' },
];

const formatVolume = (wei: string): string => {
  const eth = parseFloat(weiToEth(wei));
  if (eth >= 1_000_000) return `${(eth / 1_000_000).toFixed(1)}M`;
  if (eth >= 1_000) return `${(eth / 1_000).toFixed(1)}k`;
  if (eth >= 1) return eth.toFixed(2);
  return eth.toFixed(4);
};

const formatCount = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
};

const ParticleBackground = () => (
  <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
    {Array.from({ length: 40 }).map((_, i) => (
      <div
        key={i}
        className="particle"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          width: Math.random() * 2 + 2,
          height: Math.random() * 2 + 2,
          animationDuration: `${Math.random() * 10 + 15}s`,
          animationDelay: `-${Math.random() * 10}s`
        }}
      />
    ))}
  </div>
);

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLElement>(null);
  const howRef = useRef<HTMLElement>(null);

  const [stats, setStats] = useState([
    { value: '—', label: 'Volume Locked' },
    { value: '—', label: 'Live Auctions' },
    { value: '—', label: 'Bidders' },
    { value: '0', label: 'Front-runs Possible' },
  ]);

  useEffect(() => {
    getPlatformStats().then(({ data }) => {
      if (data) {
        setStats([
          { value: `${formatVolume(data.volumeLockedWei)} ETH`, label: 'Volume Locked' },
          { value: data.liveAuctions.toString(), label: 'Live Auctions' },
          { value: formatCount(data.totalBidders), label: 'Bidders' },
          { value: '0', label: 'Front-runs Possible' },
        ]);
      }
    });
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingTop: 64, overflow: 'hidden' }}>
      
      {/* HERO SECTION */}
      <section 
        ref={heroRef}
        style={{ position: 'relative', minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '60px 24px', zIndex: 1, perspective: 1200 }}
      >
        <HeroVideo />
        
        {/* Dark overlay */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.4))', zIndex: 0, pointerEvents: 'none' }} />
        
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} style={{ position: 'relative', zIndex: 1 }}>
          <span style={{
            display: 'inline-block', padding: '6px 18px', borderRadius: 100,
            background: 'rgba(var(--accent-primary-rgb), 0.08)', border: '1px solid rgba(var(--accent-primary-rgb), 0.2)',
            color: 'var(--accent-primary)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.15em',
            textTransform: 'uppercase', marginBottom: 28,
            backdropFilter: 'blur(4px)'
          }}>
            Real-Time · Transparent · Aura Decrypto
          </span>

          <h1 style={{
            fontFamily: 'Outfit, sans-serif', fontWeight: 900,
            fontSize: 'clamp(3rem, 8vw, 6.5rem)', lineHeight: 1.05,
            marginBottom: 24, letterSpacing: '-0.03em',
            textShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}>
            <span style={{ color: 'var(--text-primary)' }}>Bid in Silence.</span>
            <br />
            <span style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Win with Precision.
            </span>
          </h1>

          <p style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: 'rgba(var(--text-rgb), 0.8)', maxWidth: 580, margin: '0 auto 44px', lineHeight: 1.7 }}>
            The ultimate premium live-bidding experience for digital assets.
            Experience haptic interactions, real-time updates, and verifiable on-chain fairness.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <TiltButton primary={true} onClick={() => navigate('/dashboard')}>
              Launch App <ChevronRight size={18} />
            </TiltButton>
            <TiltButton primary={false} onClick={() => navigate('/docs')}>
              <Play size={16} /> How it Works
            </TiltButton>
          </div>
        </motion.div>
        {/* Hero Bottom Edge Fade */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '150px', background: 'linear-gradient(to bottom, transparent 70%, #0d0a1a 100%)', zIndex: 1, pointerEvents: 'none' }} />
      </section>

      {/* Glowing Separator */}
      <motion.div 
        initial={{ opacity: 0.5 }} 
        whileInView={{ opacity: 1, scaleX: [0.8, 1, 0.8] }} 
        transition={{ duration: 1.5, repeat: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        style={{ height: 2, background: 'linear-gradient(90deg, transparent, #8b5cf6, transparent)', width: '100%', position: 'relative', zIndex: 3 }} 
      />

      <div style={{ position: 'relative', background: '#0d0a1a', zIndex: 2 }}>
        <ParticleBackground />
        
        {/* Radial Purple Glow */}
        <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', height: '800px', background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

        {/* STATS */}
        <section style={{ position: 'relative', zIndex: 2, maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {stats.map((s, i) => (
              <motion.div key={i} 
                className="stat-card-glow"
                initial={{ opacity: 0, y: 80 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1, duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
                style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(8px)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: 16, padding: '28px 24px', textAlign: 'center', cursor: 'default' }}>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2.2rem', fontWeight: 800, color: '#8b5cf6' }}>
                  <AnimatedCounter value={s.value} />
                </div>
                <div style={{ color: '#a1a1aa', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 6 }}>{s.label}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section ref={howRef} id="how" style={{ position: 'relative', zIndex: 2, padding: '60px 0 100px', perspective: 1000 }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden', zIndex: 0 }}>
            <motion.img 
              src="/crypto-coins-bg.png" 
              style={{ position: 'absolute', width: '100%', height: '130%', top: '-15%', left: 0, objectFit: 'cover' }} 
              initial={{ y: 0 }} whileInView={{ y: '-5%' }} transition={{ ease: 'linear', duration: 1 }} 
            />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(5,2,15,0.82)' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(88,28,220,0.07)' }} />
            {/* Top Bridge Gradient */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '150px', background: 'linear-gradient(to bottom, #0d0a1a, transparent)', zIndex: 1, pointerEvents: 'none' }} />
            {/* Bottom Edge Fade */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '150px', background: 'linear-gradient(to bottom, transparent 70%, #0d0a1a 100%)', zIndex: 1, pointerEvents: 'none' }} />
          </div>

          <div style={{ position: 'relative', zIndex: 2, maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
            <motion.div initial={{ opacity: 0, y: 80 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }} style={{ textAlign: 'center', marginBottom: 60 }}>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, marginBottom: 12, color: '#ffffff' }}>How It Works</h2>
              <p style={{ color: '#a1a1aa', fontSize: '1rem', maxWidth: 500, margin: '0 auto' }}>
                Three steps to acquire premium digital assets.
              </p>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, position: 'relative', zIndex: 1 }}>
              {steps.map((step, i) => (
                <motion.div key={i} className="how-card" initial={{ opacity: 0, y: 80 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ delay: i * 0.15, duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
                  style={{ 
                    background: 'rgba(13,10,26,0.75)', backdropFilter: 'blur(16px)', borderTop: '2px solid rgba(139, 92, 246, 0.8)', borderLeft: '1px solid rgba(139, 92, 246, 0.1)', borderRight: '1px solid rgba(139, 92, 246, 0.1)', borderBottom: '1px solid rgba(139, 92, 246, 0.1)', borderRadius: 16, padding: '32px 28px', position: 'relative', overflow: 'hidden', cursor: 'default'
                  }}>
                  <div style={{ position: 'absolute', top: -30, right: -30, fontSize: '8rem', fontFamily: 'Outfit, sans-serif', fontWeight: 900, color: `rgba(139, 92, 246, 0.04)` }}>
                    {i + 1}
                  </div>
                  <div style={{ width: 64, height: 64, borderRadius: 16, background: `rgba(139, 92, 246, 0.1)`, border: `1px solid rgba(139, 92, 246, 0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                    <step.icon size={28} color="#8b5cf6" />
                  </div>
                  <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.3rem', fontWeight: 700, marginBottom: 12, color: '#ffffff' }}>{step.title}</h3>
                  <p style={{ color: '#a1a1aa', lineHeight: 1.7, fontSize: '0.9rem' }}>{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA BANNER */}
        <section style={{ position: 'relative', zIndex: 2, maxWidth: 900, margin: '0 auto 100px', padding: '0 24px' }}>
          <motion.div initial={{ opacity: 0, y: 80 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
            style={{ background: '#1a1a1a', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: 24, padding: '48px 40px', textAlign: 'center' }}>
            <Gavel size={40} color="#8b5cf6" style={{ marginBottom: 16 }} />
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2.4rem', fontWeight: 800, marginBottom: 12, color: '#ffffff' }}>Ready to bid?</h2>
            <p style={{ color: '#a1a1aa', marginBottom: 32, fontSize: '1.1rem' }}>Join thousands of bidders who trust the ultimate live crypto auction platform.</p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <TiltButton primary={true} onClick={() => navigate('/dashboard')}>
                Explore Auctions <ArrowRight size={18} />
              </TiltButton>
            </div>
          </motion.div>
        </section>

        {/* FOOTER */}
        <footer style={{ borderTop: '1px solid rgba(139, 92, 246, 0.1)', padding: '40px 24px', textAlign: 'center', color: '#a1a1aa', fontSize: '0.85rem', position: 'relative', zIndex: 2, background: '#0a0a0a' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Gavel size={14} color="#ffffff" />
            </div>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: '#ffffff', fontSize: '1rem' }}>Aura Decrypto</span>
          </div>
          © 2026 Aura Decrypto — Premium Live Auctions on Ethereum
        </footer>
      </div>

    </div>
  );
};

export default LandingPage;
