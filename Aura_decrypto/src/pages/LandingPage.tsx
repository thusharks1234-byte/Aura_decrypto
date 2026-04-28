import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gavel, ChevronRight, Play, Lock, Eye, Trophy, ArrowRight } from 'lucide-react';
import { getPlatformStats } from '../lib/supabase';
import { weiToEth } from '../lib/crypto';

const steps = [
  { icon: Lock, title: 'Commit', description: 'Submit keccak256(amount + secret + address). Your bid is completely hidden from everyone.', color: '#00ccff' },
  { icon: Eye, title: 'Reveal', description: 'After the commit phase ends, reveal your amount and secret. The contract verifies the hash.', color: '#00ff88' },
  { icon: Trophy, title: 'Win Fairly', description: 'Winner is determined on-chain. Losers can instantly claim refunds via pull-payment.', color: '#ffcc00' },
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

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [particles, setParticles] = useState<{ x: number; y: number; size: number; speed: number }[]>([]);
  const [stats, setStats] = useState([
    { value: '—', label: 'Volume Locked' },
    { value: '—', label: 'Live Auctions' },
    { value: '—', label: 'Bidders' },
    { value: '0', label: 'Front-runs Possible' },
  ]);
  const [, setStatsLoaded] = useState(false);

  useEffect(() => {
    setParticles(Array.from({ length: 30 }, () => ({
      x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 3 + 1, speed: Math.random() * 20 + 10,
    })));

    // Fetch real platform stats from Supabase
    getPlatformStats().then(({ data }) => {
      if (data) {
        setStats([
          { value: `${formatVolume(data.volumeLockedWei)} ETH`, label: 'Volume Locked' },
          { value: data.liveAuctions.toString(), label: 'Live Auctions' },
          { value: formatCount(data.totalBidders), label: 'Bidders' },
          { value: '0', label: 'Front-runs Possible' },
        ]);
      }
      setStatsLoaded(true);
    });
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#050505', paddingTop: 64 }}>
      {/* Particles */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        {particles.map((p, i) => (
          <div key={i} style={{
            position: 'absolute', left: `${p.x}%`, top: `${p.y}%`,
            width: p.size, height: p.size, borderRadius: '50%',
            background: i % 3 === 0 ? '#00ff88' : i % 3 === 1 ? '#00ccff' : '#ffffff',
            opacity: 0.15,
            animation: `float ${p.speed}s ease-in-out infinite alternate`,
          }} />
        ))}
      </div>

      {/* HERO */}
      <section style={{ position: 'relative', minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '60px 24px', zIndex: 1 }}>
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 700, background: 'radial-gradient(ellipse, rgba(0,255,136,0.08) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <span style={{
            display: 'inline-block', padding: '6px 18px', borderRadius: 100,
            background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)',
            color: '#00ff88', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.15em',
            textTransform: 'uppercase', marginBottom: 28,
          }}>
            ZK-Privacy · Commit-Reveal · Web3 Hackathon PS7
          </span>

          <h1 style={{
            fontFamily: 'Outfit, sans-serif', fontWeight: 900,
            fontSize: 'clamp(3rem, 8vw, 6.5rem)', lineHeight: 1.05,
            marginBottom: 24, letterSpacing: '-0.03em',
          }}>
            Bid in{' '}
            <span style={{ background: 'linear-gradient(135deg, #00ff88, #00ccff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Silence.
            </span>
            <br />Win with{' '}
            <span style={{ background: 'linear-gradient(135deg, #00ccff, #00ff88)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Precision.
            </span>
          </h1>

          <p style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: 'rgba(255,255,255,0.55)', maxWidth: 580, margin: '0 auto 44px', lineHeight: 1.7 }}>
            The first front-run proof sealed-bid auction platform. 
            Commit a hash. Reveal when it's safe. Let the math decide the winner.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/dashboard')}
              style={{
                background: 'linear-gradient(135deg, #00ff88, #00ccff)',
                border: 'none', borderRadius: 12, padding: '15px 32px',
                fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1rem',
                color: '#000', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              Launch App <ChevronRight size={18} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/docs')}
              style={{
                background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 12, padding: '15px 32px',
                fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '1rem',
                color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <Play size={16} /> How it Works
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* STATS */}
      <section style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {stats.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(0,255,136,0.1)', borderColor: 'rgba(0,255,136,0.2)' }}
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '28px 24px', textAlign: 'center', cursor: 'default' }}>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2.2rem', fontWeight: 800, background: 'linear-gradient(135deg, #00ff88, #00ccff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {s.value}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 6 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: '60px 24px 100px' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, marginBottom: 12 }}>How It Works</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1rem', maxWidth: 500, margin: '0 auto' }}>
            Three steps. Zero information leakage. Complete fairness.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {steps.map((step, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }}
              whileHover={{ y: -6, boxShadow: `0 16px 48px ${step.color}18`, borderColor: `${step.color}40` }}
              style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${step.color}20`, borderRadius: 20, padding: '32px 28px', position: 'relative', overflow: 'hidden', cursor: 'default' }}>
              <div style={{ position: 'absolute', top: -30, right: -30, fontSize: '8rem', fontFamily: 'Outfit, sans-serif', fontWeight: 900, color: `${step.color}06` }}>
                {i + 1}
              </div>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: `${step.color}15`, border: `1px solid ${step.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <step.icon size={24} color={step.color} />
              </div>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.3rem', fontWeight: 700, marginBottom: 12 }}>{step.title}</h3>
              <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, fontSize: '0.9rem' }}>{step.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA BANNER */}
      <section style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto 100px', padding: '0 24px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          style={{ background: 'linear-gradient(135deg, rgba(0,255,136,0.08), rgba(0,204,255,0.08))', border: '1px solid rgba(0,255,136,0.2)', borderRadius: 24, padding: '48px 40px', textAlign: 'center' }}>
          <Gavel size={40} color="#00ff88" style={{ marginBottom: 16 }} />
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2rem', fontWeight: 800, marginBottom: 12 }}>Ready to bid fairly?</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 28 }}>Join thousands of bidders who trust the math, not the middleman.</p>
          <motion.button whileHover={{ scale: 1.05, boxShadow: '0 0 32px rgba(0,255,136,0.3)' }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/dashboard')} style={{
            background: 'linear-gradient(135deg, #00ff88, #00ccff)',
            border: 'none', borderRadius: 12, padding: '14px 36px',
            fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1rem',
            color: '#000', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
          }}>
            Explore Auctions <ArrowRight size={18} />
          </motion.button>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '40px 24px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #00ff88, #00ccff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Gavel size={14} color="#000" />
          </div>
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: '#fff', fontSize: '1rem' }}>SealBid</span>
        </div>
        © 2026 SealBid Protocols — Built for Hackathon PS7 · Privacy-First Auctions on Ethereum
      </footer>

      <style>{`
        @keyframes float { from { transform: translateY(0px); } to { transform: translateY(-20px); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
};

export default LandingPage;
