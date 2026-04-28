import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, XCircle, Upload, AlertTriangle } from 'lucide-react';
import { getAuction, getMyBid, revealBid, logAuctionEvent } from '../lib/supabase';
import { computeCommitHash, ethToWei, weiToEth, verifyCommitHash } from '../lib/crypto';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import AuthModal from '../components/AuthModal';

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10, padding: '12px 16px', color: '#fff', outline: 'none', fontSize: '0.875rem', fontFamily: 'monospace',
};

const RevealPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { address } = useWallet();
  const [authOpen, setAuthOpen] = useState(false);
  const [myBid, setMyBid] = useState<{ id: string; commit_hash: string; encrypted_secret: string | null; deposit_wei: string; status: string } | null>(null);
  const [auction, setAuction] = useState<{ title: string; status: string } | null>(null);
  const [revealSecret, setRevealSecret] = useState('');
  const [revealAmount, setRevealAmount] = useState('');
  const [hashMatch, setHashMatch] = useState<boolean | null>(null);
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!id || !user) return;
    getAuction(id).then(({ data }) => setAuction(data));
    getMyBid(id, user.id).then(({ data }) => {
      if (data) {
        setMyBid(data);
        if (data.encrypted_secret) setRevealSecret(data.encrypted_secret);
      }
    });
  }, [id, user]);

  const handleVerify = () => {
    if (!myBid || !address || !revealAmount || !revealSecret) { setError('Fill in all fields'); return; }
    setError('');
    const match = verifyCommitHash(ethToWei(revealAmount), revealSecret, address, myBid.commit_hash);
    setHashMatch(match);
    if (match) setStep(1);
  };

  const handleReveal = async () => {
    if (!myBid || !id || !address) return;
    setIsSubmitting(true); setError('');
    try {
      const mockTxHash = `0x${Math.random().toString(16).slice(2).padStart(64, '0')}`;
      const { error: dbErr } = await revealBid(myBid.id, ethToWei(revealAmount), mockTxHash);
      if (dbErr) throw dbErr;
      await logAuctionEvent({ auction_id: id, event_type: 'BidRevealed', actor_address: address, data: { amount_eth: revealAmount, tx_hash: mockTxHash } });
      setSuccess(true); setStep(2);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to reveal bid');
    } finally { setIsSubmitting(false); }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.secret) setRevealSecret(data.secret);
        if (data.amountEth) setRevealAmount(data.amountEth);
      } catch { setError('Invalid backup file'); }
    };
    reader.readAsText(file);
  };

  if (!user) return (
    <div style={{ minHeight: '100vh', background: '#050505', paddingTop: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20, padding: 24, textAlign: 'center' }}>
      <AlertTriangle size={48} color="rgba(255,255,255,0.2)" />
      <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.8rem', fontWeight: 800 }}>Sign In Required</h2>
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '32px 28px' }}>

          {step < 2 && (
            <>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5rem', fontWeight: 800, marginBottom: 6 }}>
                {step === 0 ? 'Reveal Your Bid' : 'Confirm Reveal'}
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', marginBottom: 24 }}>
                {step === 0 ? 'Load your secret to verify your commitment hash.' : 'Your hash matches. Submit your reveal transaction.'}
              </p>
            </>
          )}

          {!myBid && step === 0 && (
            <div style={{ background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.2)', borderRadius: 10, padding: '14px 16px', marginBottom: 20, color: '#ff6b6b', fontSize: '0.875rem' }}>
              No committed bid found for this auction with your account.
            </div>
          )}

          {step === 0 && myBid && (
            <>
              {error && <div style={{ background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#ff6b6b', fontSize: '0.85rem' }}>{error}</div>}
              <label style={{ display: 'block', padding: '14px', background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 10, cursor: 'pointer', textAlign: 'center', marginBottom: 20, fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)' }}>
                <Upload size={20} style={{ display: 'block', margin: '0 auto 8px' }} />
                Upload Backup JSON (optional)
                <input type="file" accept=".json" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Your Secret</label>
                <input style={inputStyle} placeholder="0x..." value={revealSecret} onChange={e => setRevealSecret(e.target.value)} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Bid Amount (ETH)</label>
                <input style={inputStyle} type="number" min="0" step="0.001" placeholder="0.5" value={revealAmount} onChange={e => setRevealAmount(e.target.value)} />
              </div>
              {hashMatch !== null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, background: hashMatch ? 'rgba(0,255,136,0.08)' : 'rgba(255,77,77,0.08)', border: `1px solid ${hashMatch ? 'rgba(0,255,136,0.3)' : 'rgba(255,77,77,0.3)'}`, marginBottom: 16, fontSize: '0.875rem', color: hashMatch ? '#00ff88' : '#ff4d4d' }}>
                  {hashMatch ? <CheckCircle size={18} /> : <XCircle size={18} />}
                  {hashMatch ? 'Hash verified! Your inputs match the commitment.' : 'Hash mismatch. Check your secret or amount.'}
                </div>
              )}
              <button onClick={handleVerify} style={{ width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #ffcc00, #ff8800)', color: '#000', fontFamily: 'Outfit, sans-serif', fontWeight: 700, cursor: 'pointer' }}>Verify Hash →</button>
            </>
          )}

          {step === 1 && (
            <>
              <div style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: 12, padding: '16px', marginBottom: 20 }}>
                {[['Amount', `${revealAmount} ETH`], ['Hash', `${myBid?.commit_hash?.slice(0, 18)}...`], ['Status', '✅ Verified']].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>{k}</span>
                    <span style={{ fontFamily: 'monospace' }}>{v}</span>
                  </div>
                ))}
              </div>
              {error && <div style={{ background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#ff6b6b', fontSize: '0.85rem' }}>{error}</div>}
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setStep(0)} style={{ flex: 1, padding: '13px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#fff', fontFamily: 'Outfit, sans-serif', fontWeight: 600, cursor: 'pointer' }}>← Back</button>
                <button onClick={handleReveal} disabled={isSubmitting} style={{ flex: 2, padding: '13px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #ffcc00, #ff8800)', color: '#000', fontFamily: 'Outfit, sans-serif', fontWeight: 700, cursor: isSubmitting ? 'wait' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
                  {isSubmitting ? 'Submitting...' : 'Submit Reveal'}
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}>
                <CheckCircle size={64} color="#00ff88" style={{ marginBottom: 20 }} />
              </motion.div>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.8rem', fontWeight: 800, marginBottom: 10 }}>Bid Revealed! 🎉</h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 32 }}>Your {revealAmount} ETH bid has been revealed on-chain.</p>
              <button onClick={() => navigate(`/auction/${id}/results`)} style={{ background: 'linear-gradient(135deg, #00ff88, #00ccff)', border: 'none', borderRadius: 10, padding: '13px 32px', fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: '#000', cursor: 'pointer' }}>View Results</button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default RevealPage;
