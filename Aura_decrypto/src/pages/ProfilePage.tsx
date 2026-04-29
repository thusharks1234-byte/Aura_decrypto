import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Wallet, Award, Clock, Edit2, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { getMyBids, getDemoBalance } from '../lib/supabase';
import { weiToEth } from '../lib/crypto';
import AuthModal from '../components/AuthModal';

const shortenAddr = (a: string) => a ? `${a.slice(0,8)}...${a.slice(-6)}` : '';

const ProfilePage: React.FC = () => {
  const { user, profile, updateProfile } = useAuth();
  const { address, isConnected, connect } = useWallet();
  const [authOpen, setAuthOpen] = useState(false);
  const [myBids, setMyBids] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editName, setEditName] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [demoBalance, setDemoBalance] = useState(0);

  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => {
      setNewName(profile?.display_name || '');
    }, 0);
    getMyBids(user.id).then(({ data }) => { setMyBids((data as Record<string, unknown>[]) || []); setIsLoading(false); });
    getDemoBalance(user.id).then(bal => setDemoBalance(bal));
    return () => clearTimeout(timer);
  }, [user, profile]);

  const saveName = async () => {
    setSaving(true);
    await updateProfile({ display_name: newName });
    setSaving(false); setEditName(false);
  };

  const linkWallet = async () => {
    if (!isConnected) await connect();
    if (address) await updateProfile({ wallet_address: address });
  };

  if (!user) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingTop: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20, padding: 24, textAlign: 'center' }}>
      <User size={48} color="rgba(var(--text-rgb), 0.1)" />
      <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.8rem', fontWeight: 800 }}>Sign In to View Profile</h2>
      <button onClick={() => setAuthOpen(true)} className="btn-primary">Sign In / Register</button>
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingTop: 64 }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 80px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {/* Header Card */}
          <motion.div className="glass-card" whileHover={{ borderColor: 'rgba(var(--accent-primary-rgb), 0.2)' }}
            style={{ padding: '32px 28px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <User size={36} color="var(--btn-text)" />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              {editName ? (
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                  <input value={newName} onChange={e => setNewName(e.target.value)} className="input-field" style={{ fontSize: '1.2rem', fontFamily: 'Outfit, sans-serif', fontWeight: 700, maxWidth: 280 }} />
                  <button onClick={saveName} disabled={saving} style={{ background: 'rgba(var(--accent-primary-rgb), 0.15)', border: 'none', borderRadius: 8, padding: '8px 14px', color: 'var(--accent-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                    <Check size={16} /> {saving ? '...' : 'Save'}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.6rem', fontWeight: 800 }}>{profile?.display_name || 'Anonymous'}</h1>
                  <button onClick={() => setEditName(true)} style={{ background: 'none', border: 'none', color: 'rgba(var(--text-rgb), 0.3)', cursor: 'pointer' }}><Edit2 size={15} /></button>
                </div>
              )}
              <p style={{ color: 'rgba(var(--text-rgb), 0.3)', fontSize: '0.875rem' }}>{user.email}</p>
              {profile?.wallet_address ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-primary)' }} />
                  <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'rgba(var(--text-rgb), 0.6)' }}>{shortenAddr(profile.wallet_address)}</span>
                </div>
              ) : (
                <button onClick={linkWallet} className="btn-secondary" style={{ marginTop: 8, padding: '7px 14px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Wallet size={14} /> Link Wallet
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              {[
                { label: 'Won', val: myBids.filter(b => b.status === 'won').length, icon: Award, c: 'var(--warning)' },
                { label: 'Active', val: myBids.filter(b => ['committed','revealed'].includes(b.status as string)).length, icon: Clock, c: 'var(--accent-secondary)' },
              ].map(s => (
                <div key={s.label} style={{ background: 'rgba(var(--text-rgb), 0.04)', borderRadius: 14, padding: '16px 20px', textAlign: 'center', minWidth: 90 }}>
                  <s.icon size={18} color={s.c} style={{ marginBottom: 6 }} />
                  <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.6rem', fontWeight: 800 }}>{s.val}</div>
                  <div style={{ fontSize: '0.65rem', color: 'rgba(var(--text-rgb), 0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Demo Balance Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            whileHover={{ scale: 1.01, boxShadow: '0 8px 32px rgba(var(--warning-rgb), 0.1)' }}
            style={{
            background: 'linear-gradient(135deg, rgba(var(--warning-rgb), 0.06), rgba(255,136,0,0.04))',
            border: '1px solid rgba(var(--warning-rgb), 0.15)', borderRadius: 16,
            padding: '20px 24px', marginBottom: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
          }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(var(--warning-rgb), 0.6)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>⚗ Demo Balance</div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2rem', fontWeight: 800, color: 'var(--warning)' }}>
                {demoBalance.toFixed(4)} <span style={{ fontSize: '0.9rem', opacity: 0.6 }}>ETH</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(var(--text-rgb), 0.3)', marginTop: 4 }}>Used for demo auctions only • Not connected to your wallet</div>
            </div>
            <div style={{
              background: 'rgba(var(--warning-rgb), 0.1)', borderRadius: 12, padding: '10px 18px',
              fontSize: '0.8rem', color: 'rgba(var(--warning-rgb), 0.8)', fontWeight: 600,
            }}>
              Initial: 5.0000 ETH
            </div>
          </motion.div>

          {/* Bid History */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            style={{ background: 'rgba(var(--text-rgb), 0.02)', border: '1px solid rgba(var(--text-rgb), 0.07)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(var(--text-rgb), 0.07)', fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>My Bid History</div>
            {isLoading ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'rgba(var(--text-rgb), 0.3)' }}>Loading...</div>
            ) : myBids.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <p style={{ color: 'rgba(var(--text-rgb), 0.3)', marginBottom: 16 }}>No bids placed yet.</p>
                <Link to="/dashboard" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>Browse Auctions →</Link>
              </div>
            ) : myBids.map((b: Record<string, unknown>) => (
              <Link key={b.id as string} to={`/auction/${b.auction_id}`} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderBottom: '1px solid rgba(var(--text-rgb), 0.04)', textDecoration: 'none', color: 'var(--text-primary)', transition: 'background 0.2s' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{(b.auctions as { title: string })?.title || 'Auction'}</div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(var(--text-rgb), 0.3)' }}>{new Date(b.created_at as string).toLocaleDateString()}</div>
                </div>
                <div style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                  {b.revealed_amount_wei ? weiToEth(b.revealed_amount_wei as string) : weiToEth(b.deposit_wei as string)} ETH
                </div>
                <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: '0.7rem', fontWeight: 700, background: b.status === 'won' ? 'rgba(var(--accent-primary-rgb), 0.1)' : b.status === 'revealed' ? 'rgba(var(--accent-secondary-rgb), 0.1)' : 'rgba(var(--text-rgb), 0.05)', color: b.status === 'won' ? 'var(--accent-primary)' : b.status === 'revealed' ? 'var(--accent-secondary)' : 'rgba(var(--text-rgb), 0.4)' }}>
                  {b.status as string}
                </span>
              </Link>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
