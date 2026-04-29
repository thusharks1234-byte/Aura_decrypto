import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Info, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createAuction } from '../lib/supabase';
import { ethToWei } from '../lib/crypto';
import AuthModal from '../components/AuthModal';

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'rgba(var(--text-rgb), 0.05)', border: '1px solid rgba(var(--text-rgb), 0.1)',
  borderRadius: 10, padding: '12px 16px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem',
  fontFamily: 'Inter, sans-serif',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(var(--text-rgb), 0.6)',
  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8,
};
const sectionStyle: React.CSSProperties = {
  background: 'rgba(var(--text-rgb), 0.03)', border: '1px solid rgba(var(--text-rgb), 0.08)',
  borderRadius: 16, padding: '28px 24px', marginBottom: 20,
};

const CreateAuctionPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', asset_image_url: '', asset_type: 'NFT',
    asset_token_id: '', auction_type: 'standard' as 'standard' | 'vickrey',
    reserve_price_eth: '', duration_hours: '48', duration_minutes: '0',
    is_demo: false,
  });

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { setAuthOpen(true); return; }
    setError(''); setIsSubmitting(true);
    try {
      const durationMs = (Number(form.duration_hours || 0) * 3600000) + (Number(form.duration_minutes || 0) * 60000);
      if (durationMs <= 0) throw new Error('Auction duration must be greater than 0');
      const commitEnd = new Date(Date.now() + durationMs);
      const revealEnd = commitEnd; // Same time, effectively ignoring reveal phase
      const { data, error: dbError } = await createAuction({
        title: form.title, description: form.description,
        asset_image_url: form.asset_image_url || null,
        asset_type: form.asset_type, asset_contract: null,
        asset_token_id: form.asset_token_id || null,
        auction_type: form.auction_type,
        reserve_price_wei: ethToWei(form.reserve_price_eth || '0'),
        commit_start: new Date().toISOString(),
        commit_end: commitEnd.toISOString(),
        reveal_end: revealEnd.toISOString(),
        status: 'active', // override to active
        contract_address: `0x${Date.now().toString(16).padStart(40, '0')}`,
        creator_id: user.id, tx_hash: null, chain_id: 11155111,
        is_demo: form.is_demo,
      });
      if (dbError) throw dbError;
      navigate(`/auction/${data!.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create auction');
    } finally { setIsSubmitting(false); }
  };

  if (!user) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingTop: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20, padding: 24, textAlign: 'center' }}>
      <AlertTriangle size={48} color="rgba(var(--text-rgb), 0.2)" />
      <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.8rem', fontWeight: 800 }}>Sign in Required</h2>
      <p style={{ color: 'rgba(var(--text-rgb), 0.4)' }}>You need to be signed in to create an auction.</p>
      <button onClick={() => setAuthOpen(true)} style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', border: 'none', borderRadius: 10, padding: '12px 28px', fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: 'var(--btn-text)', cursor: 'pointer' }}>Sign In / Register</button>
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingTop: 64 }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 80px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2.2rem', fontWeight: 800, marginBottom: 8 }}>Create Live Auction</h1>
          <p style={{ color: 'rgba(var(--text-rgb), 0.4)', marginBottom: 32 }}>Configure your open auction. Bids will be publicly visible in real-time.</p>
          {error && <div style={{ background: 'rgba(var(--error-rgb), 0.1)', border: '1px solid rgba(var(--error-rgb), 0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#ff6b6b', fontSize: '0.875rem' }}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={sectionStyle}>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, marginBottom: 20, color: 'var(--accent-primary)' }}>A — Asset Details</h3>
              <div style={{ marginBottom: 16 }}><label style={labelStyle}>Auction Title *</label><input style={inputStyle} placeholder="e.g. Eternal Void #042" value={form.title} onChange={e => update('title', e.target.value)} required /></div>
              <div style={{ marginBottom: 16 }}><label style={labelStyle}>Description</label><textarea style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }} placeholder="Describe the asset..." value={form.description} onChange={e => update('description', e.target.value)} /></div>
              <div style={{ marginBottom: 16 }}><label style={labelStyle}>Asset Image URL</label><input style={inputStyle} placeholder="https://..." value={form.asset_image_url} onChange={e => update('asset_image_url', e.target.value)} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div><label style={labelStyle}>Asset Type</label><select style={inputStyle} value={form.asset_type} onChange={e => update('asset_type', e.target.value)}><option>NFT</option><option>Token</option><option>Physical</option><option>Other</option></select></div>
                <div><label style={labelStyle}>Token ID</label><input style={inputStyle} placeholder="e.g. 1234" value={form.asset_token_id} onChange={e => update('asset_token_id', e.target.value)} /></div>
              </div>
            </motion.div>

            <div style={sectionStyle}>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, marginBottom: 20, color: 'var(--accent-secondary)' }}>B — Auction Config</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                {(['standard', 'vickrey'] as const).map(t => (
                  <motion.button 
                    key={t} 
                    type="button" 
                    whileHover={{ scale: 1.02, background: form.auction_type === t ? 'rgba(var(--accent-primary-rgb), 0.12)' : 'rgba(var(--text-rgb), 0.05)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => update('auction_type', t)} 
                    style={{ padding: '14px', borderRadius: 10, border: `2px solid ${form.auction_type === t ? 'var(--accent-primary)' : 'rgba(var(--text-rgb), 0.1)'}`, background: form.auction_type === t ? 'rgba(var(--accent-primary-rgb), 0.08)' : 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                    <div style={{ fontWeight: 700, color: form.auction_type === t ? 'var(--accent-primary)' : 'var(--text-primary)', textTransform: 'capitalize', marginBottom: 4 }}>{t}</div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(var(--text-rgb), 0.4)' }}>{t === 'standard' ? 'Winner pays own bid' : 'Winner pays 2nd highest (fair)'}</div>
                  </motion.button>
                ))}
              </div>

              {/* Demo / Live toggle */}
              <label style={{ ...labelStyle, marginTop: 16 }}>Auction Mode</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <motion.button 
                  type="button" 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setForm(f => ({ ...f, is_demo: false }))} 
                  style={{
                    padding: '14px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                    border: `2px solid ${!form.is_demo ? 'var(--accent-primary)' : 'rgba(var(--text-rgb), 0.1)'}`,
                    background: !form.is_demo ? 'rgba(var(--accent-primary-rgb), 0.08)' : 'transparent',
                    transition: 'all 0.2s'
                  }}>
                  <div style={{ fontWeight: 700, color: !form.is_demo ? 'var(--accent-primary)' : 'var(--text-primary)', marginBottom: 4 }}>● Live</div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(var(--text-rgb), 0.4)' }}>Uses real ETH from MetaMask</div>
                </motion.button>
                <motion.button 
                  type="button" 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setForm(f => ({ ...f, is_demo: true }))} 
                  style={{
                    padding: '14px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                    border: `2px solid ${form.is_demo ? 'var(--warning)' : 'rgba(var(--text-rgb), 0.1)'}`,
                    background: form.is_demo ? 'rgba(var(--warning-rgb), 0.08)' : 'transparent',
                    transition: 'all 0.2s'
                  }}>
                  <div style={{ fontWeight: 700, color: form.is_demo ? 'var(--warning)' : 'var(--text-primary)', marginBottom: 4 }}>⚗ Demo</div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(var(--text-rgb), 0.4)' }}>Uses demo balance (5 ETH)</div>
                </motion.button>
              </div>

              <div style={{ marginBottom: 16 }}><label style={labelStyle}>Reserve Price (ETH) *</label><input style={inputStyle} type="number" min="0" step="0.001" placeholder="0.5" value={form.reserve_price_eth} onChange={e => update('reserve_price_eth', e.target.value)} required /></div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Auction Duration</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <input style={{...inputStyle, paddingRight: 45}} type="number" min="0" value={form.duration_hours} onChange={e => update('duration_hours', e.target.value)} />
                    <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(var(--text-rgb), 0.4)', fontSize: '0.8rem', pointerEvents: 'none' }}>hrs</span>
                  </div>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <input style={{...inputStyle, paddingRight: 55}} type="number" min="0" max="59" value={form.duration_minutes} onChange={e => update('duration_minutes', e.target.value)} />
                    <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(var(--text-rgb), 0.4)', fontSize: '0.8rem', pointerEvents: 'none' }}>mins</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(var(--accent-secondary-rgb), 0.05)', border: '1px solid rgba(var(--accent-secondary-rgb), 0.2)', borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 12, marginBottom: 24, alignItems: 'flex-start' }}>
              <Info size={18} color="var(--accent-secondary)" style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: '0.82rem', color: 'rgba(var(--text-rgb), 0.5)', lineHeight: 1.6, margin: 0 }}>In a real deployment, this triggers a smart contract factory transaction. For this demo, the live auction record is stored in Supabase and bidding is fully functional in real-time.</p>
            </div>

            <motion.button 
              type="submit" 
              disabled={isSubmitting} 
              whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(var(--accent-primary-rgb), 0.3)' }} 
              whileTap={{ scale: 0.98 }}
              style={{ width: '100%', padding: '16px', borderRadius: 12, border: 'none', background: isSubmitting ? 'rgba(var(--text-rgb), 0.1)' : 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', color: isSubmitting ? 'rgba(var(--text-rgb), 0.4)' : 'var(--btn-text)', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.05rem', cursor: isSubmitting ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              {isSubmitting ? 'Creating...' : <> Deploy Auction <ChevronRight size={18} /></>}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateAuctionPage;
