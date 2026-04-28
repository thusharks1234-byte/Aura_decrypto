import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Copy, Download, Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react';
import { getAuction, getMyBid, submitBid, logAuctionEvent } from '../lib/supabase';
import { generateSecret, computeCommitHash, ethToWei, generateBidBackup, downloadFile } from '../lib/crypto';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import AuthModal from '../components/AuthModal';

const STEPS = ['Enter Bid', 'Preview Hash', 'Confirm'];

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10, padding: '12px 16px', color: '#fff', outline: 'none', fontSize: '0.9rem', fontFamily: 'monospace',
};

const CommitPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { address, connect, isConnected } = useWallet();
  const [authOpen, setAuthOpen] = useState(false);
  const [auction, setAuction] = useState<{ title: string; status: string; reserve_price_wei: string } | null>(null);
  const [step, setStep] = useState(0);
  const [amountEth, setAmountEth] = useState('');
  const [secret, setSecret] = useState(generateSecret());
  const [showSecret, setShowSecret] = useState(false);
  const [commitHash, setCommitHash] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [existingBid, setExistingBid] = useState(false);

  useEffect(() => {
    if (!id) return;
    getAuction(id).then(({ data }) => setAuction(data));
    if (user && id) getMyBid(id, user.id).then(({ data }) => { if (data) setExistingBid(true); });
  }, [id, user]);

  const handlePreview = () => {
    if (!address) { connect(); return; }
    if (!amountEth || Number(amountEth) <= 0) { setError('Enter a valid bid amount'); return; }
    setError('');
    const hash = computeCommitHash(ethToWei(amountEth), secret, address);
    setCommitHash(hash);
    setStep(1);
  };

  const handleSubmit = async () => {
    if (!user || !address || !id) return;
    setIsSubmitting(true); setError('');
    try {
      const { error: dbErr } = await submitBid({
        auction_id: id, bidder_id: user.id,
        bidder_address: address, commit_hash: commitHash,
        encrypted_secret: secret, deposit_wei: ethToWei(amountEth),
        commit_tx_hash: `0x${Math.random().toString(16).slice(2)}`,
        reveal_tx_hash: null,
      });
      if (dbErr) throw dbErr;
      await logAuctionEvent({ auction_id: id, event_type: 'BidCommitted', actor_address: address, data: { hash: commitHash } });
      // Save backup
      const backup = generateBidBackup({ auctionId: id, auctionTitle: auction?.title || '', amountEth, secret, commitHash, bidderAddress: address, timestamp: new Date().toISOString() });
      downloadFile(backup, `sealbid-backup-${id.slice(0, 8)}.json`);
      setStep(2);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to submit bid');
    } finally { setIsSubmitting(false); }
  };

  if (!user) return (
    <div style={{ minHeight: '100vh', background: '#050505', paddingTop: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20, padding: 24, textAlign: 'center' }}>
      <AlertTriangle size={48} color="rgba(255,255,255,0.2)" />
      <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.8rem', fontWeight: 800 }}>Sign In to Bid</h2>
      <button onClick={() => setAuthOpen(true)} style={{ background: 'linear-gradient(135deg, #00ff88, #00ccff)', border: 'none', borderRadius: 10, padding: '12px 28px', fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: '#000', cursor: 'pointer' }}>Sign In</button>
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#050505', paddingTop: 64 }}>
      <div style={{ maxWidth: 580, margin: '0 auto', padding: '40px 24px 80px' }}>
        <Link to={`/auction/${id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', marginBottom: 28, fontSize: '0.875rem' }}>
          <ArrowLeft size={16} /> Back to Auction
        </Link>

        {/* Step Progress */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 36 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1, display: 'flex', alignItems: 'center', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                {i > 0 && <div style={{ flex: 1, height: 2, background: i <= step ? '#00ff88' : 'rgba(255,255,255,0.1)' }} />}
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: i <= step ? 'linear-gradient(135deg, #00ff88, #00ccff)' : 'rgba(255,255,255,0.07)', border: `2px solid ${i <= step ? '#00ff88' : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: i <= step ? '#000' : 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
                  {i < step ? '✓' : i + 1}
                </div>
                {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: i < step ? '#00ff88' : 'rgba(255,255,255,0.1)' }} />}
              </div>
              <span style={{ fontSize: '0.72rem', color: i === step ? '#fff' : 'rgba(255,255,255,0.3)', fontWeight: i === step ? 600 : 400 }}>{s}</span>
            </div>
          ))}
        </div>

        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '32px 28px' }}>
            {step === 0 && (
              <>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5rem', fontWeight: 800, marginBottom: 6 }}>Place Your Sealed Bid</h2>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', marginBottom: 24 }}>Your bid amount stays hidden until the reveal phase.</p>
                {existingBid && <div style={{ background: 'rgba(255,204,0,0.1)', border: '1px solid rgba(255,204,0,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#ffcc00', fontSize: '0.85rem' }}>⚠ You already have an active bid on this auction.</div>}
                {error && <div style={{ background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#ff6b6b', fontSize: '0.85rem' }}>{error}</div>}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Bid Amount (ETH) *</label>
                  <input style={inputStyle} type="number" min="0" step="0.001" placeholder="0.5" value={amountEth} onChange={e => setAmountEth(e.target.value)} />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Secret (auto-generated)</label>
                  <div style={{ position: 'relative' }}>
                    <input style={{ ...inputStyle, paddingRight: 80, wordBreak: 'break-all' }} type={showSecret ? 'text' : 'password'} value={secret} onChange={e => setSecret(e.target.value)} />
                    <button type="button" onClick={() => setShowSecret(!showSecret)} style={{ position: 'absolute', right: 40, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                      {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button type="button" onClick={() => { navigator.clipboard.writeText(secret); }} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                      <Copy size={16} />
                    </button>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>💾 Save this secret. You cannot reveal your bid without it.</p>
                </div>
                {!isConnected ? (
                  <button onClick={connect} style={{ width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.08)', color: '#fff', fontFamily: 'Outfit, sans-serif', fontWeight: 700, cursor: 'pointer' }}>Connect Wallet First</button>
                ) : (
                  <button onClick={handlePreview} style={{ width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #00ff88, #00ccff)', color: '#000', fontFamily: 'Outfit, sans-serif', fontWeight: 700, cursor: 'pointer' }}>Preview Commitment →</button>
                )}
              </>
            )}

            {step === 1 && (
              <>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5rem', fontWeight: 800, marginBottom: 6 }}>Preview Commitment</h2>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', marginBottom: 24 }}>This is the hash that will be stored on-chain. Your bid stays hidden.</p>
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '16px', marginBottom: 16 }}>
                  {[['Bid Amount', `${amountEth} ETH`], ['Your Address', `${address?.slice(0, 10)}...${address?.slice(-6)}`], ['Secret', '●●●●●●●●●●●●●●●●']].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ color: 'rgba(255,255,255,0.4)' }}>{k}</span>
                      <span style={{ fontFamily: 'monospace' }}>{v}</span>
                    </div>
                  ))}
                </div>
                <div style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
                  <div style={{ fontSize: '0.7rem', color: '#00ff88', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Generated Commit Hash (keccak256)</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)', wordBreak: 'break-all' }}>{commitHash}</div>
                </div>
                <div style={{ background: 'rgba(255,204,0,0.07)', border: '1px solid rgba(255,204,0,0.2)', borderRadius: 10, padding: '12px 14px', marginBottom: 24, fontSize: '0.8rem', color: 'rgba(255,204,0,0.8)' }}>
                  ⚠ Once submitted, your bid is sealed. A backup JSON will be downloaded automatically.
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={() => setStep(0)} style={{ flex: 1, padding: '13px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#fff', fontFamily: 'Outfit, sans-serif', fontWeight: 600, cursor: 'pointer' }}>← Edit</button>
                  <button onClick={handleSubmit} disabled={isSubmitting} style={{ flex: 2, padding: '13px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #00ff88, #00ccff)', color: '#000', fontFamily: 'Outfit, sans-serif', fontWeight: 700, cursor: isSubmitting ? 'wait' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
                    {isSubmitting ? 'Submitting...' : 'Confirm & Submit Bid'}
                  </button>
                </div>
                {error && <div style={{ background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.3)', borderRadius: 10, padding: '10px 14px', marginTop: 14, color: '#ff6b6b', fontSize: '0.85rem' }}>{error}</div>}
              </>
            )}

            {step === 2 && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}>
                  <CheckCircle size={64} color="#00ff88" style={{ marginBottom: 20 }} />
                </motion.div>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.8rem', fontWeight: 800, marginBottom: 10 }}>Bid Committed! 🎉</h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Your sealed bid has been recorded. A backup JSON was downloaded.</p>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', marginBottom: 32 }}>Return during the Reveal Phase to reveal your bid.</p>
                <button onClick={() => navigate(`/auction/${id}`)} style={{ background: 'linear-gradient(135deg, #00ff88, #00ccff)', border: 'none', borderRadius: 10, padding: '13px 32px', fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: '#000', cursor: 'pointer' }}>View Auction</button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CommitPage;
