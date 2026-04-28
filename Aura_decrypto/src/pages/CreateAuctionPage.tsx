import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Info, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createAuction } from '../lib/supabase';
import { ethToWei } from '../lib/crypto';
import AuthModal from '../components/AuthModal';

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10, padding: '12px 16px', color: '#fff', outline: 'none', fontSize: '0.9rem',
  fontFamily: 'Inter, sans-serif',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)',
  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8,
};
const sectionStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
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
    reserve_price_eth: '', commit_hours: '48', reveal_hours: '24',
  });

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { setAuthOpen(true); return; }
    setError(''); setIsSubmitting(true);
    try {
      const commitEnd = new Date(Date.now() + Number(form.commit_hours) * 3600000);
      const revealEnd = new Date(commitEnd.getTime() + Number(form.reveal_hours) * 3600000);
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
        contract_address: `0x${Date.now().toString(16).padStart(40, '0')}`,
        creator_id: user.id, tx_hash: null, chain_id: 11155111,
      });
      if (dbError) throw dbError;
      navigate(`/auction/${data!.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create auction');
    } finally { setIsSubmitting(false); }
  };

  if (!user) return (
    <div style={{ minHeight: '100vh', background: '#050505', paddingTop: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20, padding: 24, textAlign: 'center' }}>
      <AlertTriangle size={48} color="rgba(255,255,255,0.2)" />
      <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.8rem', fontWeight: 800 }}>Sign in Required</h2>
      <p style={{ color: 'rgba(255,255,255,0.4)' }}>You need to be signed in to create an auction.</p>
      <button onClick={() => setAuthOpen(true)} style={{ background: 'linear-gradient(135deg, #00ff88, #00ccff)', border: 'none', borderRadius: 10, padding: '12px 28px', fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: '#000', cursor: 'pointer' }}>Sign In / Register</button>
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#050505', paddingTop: 64 }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 80px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2.2rem', fontWeight: 800, marginBottom: 8 }}>Create Sealed Auction</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 32 }}>Configure your auction. Bids will be cryptographically hidden until reveal.</p>
          {error && <div style={{ background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#ff6b6b', fontSize: '0.875rem' }}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div style={sectionStyle}>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, marginBottom: 20, color: '#00ff88' }}>A — Asset Details</h3>
              <div style={{ marginBottom: 16 }}><label style={labelStyle}>Auction Title *</label><input style={inputStyle} placeholder="e.g. Eternal Void #042" value={form.title} onChange={e => update('title', e.target.value)} required /></div>
              <div style={{ marginBottom: 16 }}><label style={labelStyle}>Description</label><textarea style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }} placeholder="Describe the asset..." value={form.description} onChange={e => update('description', e.target.value)} /></div>
              <div style={{ marginBottom: 16 }}><label style={labelStyle}>Asset Image URL</label><input style={inputStyle} placeholder="https://..." value={form.asset_image_url} onChange={e => update('asset_image_url', e.target.value)} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div><label style={labelStyle}>Asset Type</label><select style={inputStyle} value={form.asset_type} onChange={e => update('asset_type', e.target.value)}><option>NFT</option><option>Token</option><option>Physical</option><option>Other</option></select></div>
                <div><label style={labelStyle}>Token ID</label><input style={inputStyle} placeholder="e.g. 1234" value={form.asset_token_id} onChange={e => update('asset_token_id', e.target.value)} /></div>
              </div>
            </div>

            <div style={sectionStyle}>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, marginBottom: 20, color: '#00ccff' }}>B — Auction Config</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                {(['standard', 'vickrey'] as const).map(t => (
                  <button key={t} type="button" onClick={() => update('auction_type', t)} style={{ padding: '14px', borderRadius: 10, border: `2px solid ${form.auction_type === t ? '#00ff88' : 'rgba(255,255,255,0.1)'}`, background: form.auction_type === t ? 'rgba(0,255,136,0.08)' : 'transparent', cursor: 'pointer', textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, color: form.auction_type === t ? '#00ff88' : '#fff', textTransform: 'capitalize', marginBottom: 4 }}>{t}</div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>{t === 'standard' ? 'Winner pays own bid' : 'Winner pays 2nd highest (fair)'}</div>
                  </button>
                ))}
              </div>
              <div style={{ marginBottom: 16 }}><label style={labelStyle}>Reserve Price (ETH) *</label><input style={inputStyle} type="number" min="0" step="0.001" placeholder="0.5" value={form.reserve_price_eth} onChange={e => update('reserve_price_eth', e.target.value)} required /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div><label style={labelStyle}>Commit Duration (hrs)</label><input style={inputStyle} type="number" min="1" value={form.commit_hours} onChange={e => update('commit_hours', e.target.value)} /></div>
                <div><label style={labelStyle}>Reveal Duration (hrs)</label><input style={inputStyle} type="number" min="1" value={form.reveal_hours} onChange={e => update('reveal_hours', e.target.value)} /></div>
              </div>
            </div>

            <div style={{ background: 'rgba(0,204,255,0.05)', border: '1px solid rgba(0,204,255,0.2)', borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 12, marginBottom: 24, alignItems: 'flex-start' }}>
              <Info size={18} color="#00ccff" style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: 0 }}>In a real deployment, this triggers a smart contract factory transaction. For this demo, the auction record is stored in Supabase and the commit/reveal flow is fully functional.</p>
            </div>

            <motion.button type="submit" disabled={isSubmitting} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              style={{ width: '100%', padding: '16px', borderRadius: 12, border: 'none', background: isSubmitting ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #00ff88, #00ccff)', color: isSubmitting ? 'rgba(255,255,255,0.4)' : '#000', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.05rem', cursor: isSubmitting ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              {isSubmitting ? 'Creating...' : <> Deploy Auction <ChevronRight size={18} /></>}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateAuctionPage;
