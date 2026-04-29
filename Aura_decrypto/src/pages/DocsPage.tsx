import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, Trophy, Shield, AlertTriangle, ArrowRight, Hash, Key, RefreshCw } from 'lucide-react';

const fadeUp = (i: number) => ({ initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, transition: { delay: i * 0.1 }, viewport: { once: true } });

const DocsPage: React.FC = () => (
  <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingTop: 64 }}>
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '48px 24px 100px' }}>
      {/* Hero */}
      <motion.div {...fadeUp(0)} style={{ textAlign: 'center', marginBottom: 64 }}>
        <span style={{ display: 'inline-block', padding: '6px 16px', borderRadius: 100, background: 'rgba(var(--accent-primary-rgb), 0.08)', border: '1px solid rgba(var(--accent-primary-rgb), 0.2)', color: 'var(--accent-primary)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 20 }}>
          Technical Documentation
        </span>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: 16 }}>
          How <span style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Aura Decrypto</span> Works
        </h1>
        <p style={{ color: 'rgba(var(--text-rgb), 0.5)', fontSize: '1.05rem', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
          A deep dive into the real-time live auction protocol, smart contract integration, and the cryptographic guarantees that ensure fair bidding.
        </p>
      </motion.div>

      {/* Timeline */}
      <div style={{ position: 'relative', marginBottom: 72 }}>
        <div style={{ position: 'absolute', left: 28, top: 0, bottom: 0, width: 2, background: 'rgba(var(--text-rgb), 0.06)' }} />
        {[
          { icon: Eye, color: 'var(--accent-secondary)', title: 'Phase 1 — Discover', desc: 'Browse live open auctions. View current bids, premium digital assets, and participate directly via MetaMask.', code: '' },
          { icon: Trophy, color: 'var(--accent-primary)', title: 'Phase 2 — Live Bidding', desc: 'Place bids in real-time. Smart contracts verify if your bid is higher than the current highest bid before confirming it.', code: 'require(msg.value > highestBid, "Bid too low");' },
          { icon: Lock, color: 'var(--warning)', title: 'Phase 3 — Finalize', desc: 'The contract automatically determines the winner when the timer expires. Losers can claim refunds via pull-payment.' },
        ].map((step, i) => (
          <motion.div key={i} {...fadeUp(i + 1)} style={{ display: 'flex', gap: 24, marginBottom: 40, position: 'relative' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: `${step.color}12`, border: `1px solid ${step.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
              <step.icon size={24} color={step.color} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.25rem', fontWeight: 700, marginBottom: 8, color: step.color }}>{step.title}</h3>
              <p style={{ color: 'rgba(var(--text-rgb), 0.5)', lineHeight: 1.7, fontSize: '0.92rem', marginBottom: step.code ? 12 : 0 }}>{step.desc}</p>
              {step.code && (
                <div style={{ background: 'rgba(var(--text-rgb), 0.04)', border: '1px solid rgba(var(--text-rgb), 0.08)', borderRadius: 10, padding: '12px 16px', fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--accent-primary)', overflowX: 'auto' }}>
                  {step.code}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Key Concepts */}
      <motion.div {...fadeUp(4)} style={{ marginBottom: 48 }}>
        <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.8rem', fontWeight: 800, marginBottom: 24 }}>Key Concepts</h2>
        <div style={{ display: 'grid', gap: 16 }}>
          {[
            { icon: Hash, title: 'Real-Time State Sync', desc: 'Bids are instantly synchronized across all clients via Supabase Realtime and blockchain events.' },
            { icon: Shield, title: 'On-Chain Verifiability', desc: 'Every bid transaction is recorded on the blockchain (Ethereum Sepolia). Bidders can independently verify the auction state.' },
            { icon: Key, title: 'Premium Aesthetics', desc: 'Aura Decrypto combines robust smart contract infrastructure with a highly responsive, premium glassmorphic UI.' },
            { icon: RefreshCw, title: 'Pull-Payment Refunds', desc: 'Losing bidders claim refunds by calling claimRefund(). We use the Checks-Effects-Interactions pattern with OpenZeppelin\'s ReentrancyGuard to prevent reentrancy attacks.' },
          ].map((c, i) => (
            <motion.div 
              key={i} 
              whileHover={{ y: -5, background: 'rgba(var(--text-rgb), 0.05)', borderColor: 'rgba(var(--accent-primary-rgb), 0.2)' }}
              style={{ background: 'rgba(var(--text-rgb), 0.03)', border: '1px solid rgba(var(--text-rgb), 0.08)', borderRadius: 16, padding: '24px', display: 'flex', gap: 18, alignItems: 'flex-start', transition: 'all 0.3s', cursor: 'default' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(var(--accent-primary-rgb), 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <c.icon size={20} color="var(--accent-primary)" />
              </div>
              <div>
                <h4 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, marginBottom: 6 }}>{c.title}</h4>
                <p style={{ color: 'rgba(var(--text-rgb), 0.45)', lineHeight: 1.7, fontSize: '0.88rem' }}>{c.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Security */}
      <motion.div {...fadeUp(5)} style={{ marginBottom: 48 }}>
        <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.8rem', fontWeight: 800, marginBottom: 24 }}>Security Guarantees</h2>
        <div style={{ background: 'rgba(var(--warning-rgb), 0.05)', border: '1px solid rgba(var(--warning-rgb), 0.15)', borderRadius: 16, padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <AlertTriangle size={20} color="var(--warning)" />
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: 'var(--warning)' }}>Smart Contract Security</span>
          </div>
          <ul style={{ color: 'rgba(var(--text-rgb), 0.5)', lineHeight: 2, fontSize: '0.9rem', paddingLeft: 20 }}>
            <li><strong style={{ color: 'var(--text-primary)' }}>ReentrancyGuard</strong> — OpenZeppelin guard on all ETH-sending functions</li>
            <li><strong style={{ color: 'var(--text-primary)' }}>Checks-Effects-Interactions</strong> — State updated before external calls</li>
            <li><strong style={{ color: 'var(--text-primary)' }}>Time Limits</strong> — Strict on-chain enforcement of auction deadlines</li>
            <li><strong style={{ color: 'var(--text-primary)' }}>Pull-Payment</strong> — No push to multiple addresses in loops</li>
            <li><strong style={{ color: 'var(--text-primary)' }}>Real-time Subscriptions</strong> — Ensures users always see the latest bid data</li>
          </ul>
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div {...fadeUp(6)} style={{ textAlign: 'center', padding: '48px 28px', background: 'linear-gradient(135deg, rgba(var(--accent-primary-rgb), 0.06), rgba(var(--accent-secondary-rgb), 0.06))', border: '1px solid rgba(var(--accent-primary-rgb), 0.15)', borderRadius: 20 }}>
        <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.8rem', fontWeight: 800, marginBottom: 12 }}>Ready to experience fair auctions?</h2>
        <p style={{ color: 'rgba(var(--text-rgb), 0.4)', marginBottom: 28 }}>Create your first live auction or join one now.</p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/dashboard" style={{ textDecoration: 'none' }}>
            <motion.button 
              whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(var(--accent-primary-rgb), 0.3)' }}
              whileTap={{ scale: 0.95 }}
              className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              Explore Auctions <ArrowRight size={16} />
            </motion.button>
          </Link>
          <Link to="/auction/create" style={{ textDecoration: 'none' }}>
            <motion.button 
              whileHover={{ scale: 1.05, background: 'rgba(var(--text-rgb), 0.08)' }}
              whileTap={{ scale: 0.95 }}
              className="btn-secondary">Create Auction</motion.button>
          </Link>
        </div>
      </motion.div>
    </div>
  </div>
);

export default DocsPage;
