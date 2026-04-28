import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, Trophy, Shield, AlertTriangle, ArrowRight, Hash, Key, RefreshCw } from 'lucide-react';

const fadeUp = (i: number) => ({ initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, transition: { delay: i * 0.1 }, viewport: { once: true } });

const DocsPage: React.FC = () => (
  <div style={{ minHeight: '100vh', background: '#050505', paddingTop: 64 }}>
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '48px 24px 100px' }}>
      {/* Hero */}
      <motion.div {...fadeUp(0)} style={{ textAlign: 'center', marginBottom: 64 }}>
        <span style={{ display: 'inline-block', padding: '6px 16px', borderRadius: 100, background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)', color: '#00ff88', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 20 }}>
          Technical Documentation
        </span>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: 16 }}>
          How <span style={{ background: 'linear-gradient(135deg, #00ff88, #00ccff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SealBid</span> Works
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.05rem', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
          A deep dive into the commit-reveal protocol, Vickrey auctions, and the cryptographic guarantees that make front-running impossible.
        </p>
      </motion.div>

      {/* Timeline */}
      <div style={{ position: 'relative', marginBottom: 72 }}>
        <div style={{ position: 'absolute', left: 28, top: 0, bottom: 0, width: 2, background: 'rgba(255,255,255,0.06)' }} />
        {[
          { icon: Lock, color: '#00ccff', title: 'Phase 1 — Commit', desc: 'Bidder submits keccak256(amount ‖ secret ‖ address) along with a deposit ≥ bid amount. The bid value is completely hidden on-chain — only the hash is stored.', code: 'commitHash = keccak256(abi.encodePacked(amount, secret, msg.sender))' },
          { icon: Eye, color: '#00ff88', title: 'Phase 2 — Reveal', desc: 'After the commit window closes, bidders reveal their amount and secret. The contract recomputes the hash and verifies it matches the stored commitment.', code: 'require(keccak256(abi.encodePacked(amount, secret, msg.sender)) == storedHash)' },
          { icon: Trophy, color: '#ffcc00', title: 'Phase 3 — Finalize', desc: 'The contract determines the winner. In Standard mode, winner pays their bid. In Vickrey mode, winner pays the 2nd-highest price. All losers can claim refunds via pull-payment.' },
        ].map((step, i) => (
          <motion.div key={i} {...fadeUp(i + 1)} style={{ display: 'flex', gap: 24, marginBottom: 40, position: 'relative' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: `${step.color}12`, border: `1px solid ${step.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
              <step.icon size={24} color={step.color} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.25rem', fontWeight: 700, marginBottom: 8, color: step.color }}>{step.title}</h3>
              <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, fontSize: '0.92rem', marginBottom: step.code ? 12 : 0 }}>{step.desc}</p>
              {step.code && (
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px 16px', fontFamily: 'monospace', fontSize: '0.78rem', color: '#00ff88', overflowX: 'auto' }}>
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
            { icon: Hash, title: 'Commit-Reveal Scheme', desc: 'A two-phase cryptographic protocol where bidders first commit a hash of their bid, then reveal the original values. This prevents any observer from learning bid amounts before the reveal phase.' },
            { icon: Shield, title: 'Front-Running Protection', desc: 'Since bids are hashed during the commit phase, MEV bots and malicious miners cannot see or outbid genuine participants. The hash is computed using keccak256 with the bidder\'s address as a salt.' },
            { icon: Key, title: 'Vickrey (2nd-Price) Auction', desc: 'In a Vickrey auction, the highest bidder wins but pays the second-highest price. This makes bidding your true valuation the dominant strategy — no more bid shading or strategic underbidding.' },
            { icon: RefreshCw, title: 'Pull-Payment Refunds', desc: 'Losing bidders claim refunds by calling claimRefund(). We use the Checks-Effects-Interactions pattern with OpenZeppelin\'s ReentrancyGuard to prevent reentrancy attacks.' },
          ].map((c, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '24px', display: 'flex', gap: 18, alignItems: 'flex-start' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(0,255,136,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <c.icon size={20} color="#00ff88" />
              </div>
              <div>
                <h4 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, marginBottom: 6 }}>{c.title}</h4>
                <p style={{ color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, fontSize: '0.88rem' }}>{c.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Security */}
      <motion.div {...fadeUp(5)} style={{ marginBottom: 48 }}>
        <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.8rem', fontWeight: 800, marginBottom: 24 }}>Security Guarantees</h2>
        <div style={{ background: 'rgba(255,204,0,0.05)', border: '1px solid rgba(255,204,0,0.15)', borderRadius: 16, padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <AlertTriangle size={20} color="#ffcc00" />
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: '#ffcc00' }}>Smart Contract Security</span>
          </div>
          <ul style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 2, fontSize: '0.9rem', paddingLeft: 20 }}>
            <li><strong style={{ color: '#fff' }}>ReentrancyGuard</strong> — OpenZeppelin guard on all ETH-sending functions</li>
            <li><strong style={{ color: '#fff' }}>Checks-Effects-Interactions</strong> — State updated before external calls</li>
            <li><strong style={{ color: '#fff' }}>Phase State Machine</strong> — All actions gated by current auction phase</li>
            <li><strong style={{ color: '#fff' }}>Pull-Payment</strong> — No push to multiple addresses in loops</li>
            <li><strong style={{ color: '#fff' }}>Hash Verification</strong> — keccak256 with address salt prevents hash collision attacks</li>
          </ul>
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div {...fadeUp(6)} style={{ textAlign: 'center', padding: '48px 28px', background: 'linear-gradient(135deg, rgba(0,255,136,0.06), rgba(0,204,255,0.06))', border: '1px solid rgba(0,255,136,0.15)', borderRadius: 20 }}>
        <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.8rem', fontWeight: 800, marginBottom: 12 }}>Ready to experience fair auctions?</h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 28 }}>Create your first sealed-bid auction or join one now.</p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/dashboard" style={{ textDecoration: 'none' }}>
            <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              Explore Auctions <ArrowRight size={16} />
            </button>
          </Link>
          <Link to="/auction/create" style={{ textDecoration: 'none' }}>
            <button className="btn-secondary">Create Auction</button>
          </Link>
        </div>
      </motion.div>
    </div>
  </div>
);

export default DocsPage;
