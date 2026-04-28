import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, Users, Clock, ShieldCheck } from 'lucide-react';
import { getAuction, getBidsForAuction, getAuctionEvents, type Auction, type Bid } from '../lib/supabase';
import { weiToEth } from '../lib/crypto';
import PhaseBadge from '../components/PhaseBadge';
import CountdownTimer from '../components/CountdownTimer';
import { supabase } from '../lib/supabaseClient';

const shortenAddr = (a: string) => a ? `${a.slice(0, 8)}...${a.slice(-6)}` : '';

const AuctionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [events, setEvents] = useState<{ id: string; event_type: string; actor_address: string | null; created_at: string; data: Record<string, unknown> | null }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    loadData();
    // Realtime subscription for bids
    const sub = supabase.channel(`auction_${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bids', filter: `auction_id=eq.${id}` },
        () => loadBids())
      .subscribe();
    return () => { sub.unsubscribe(); };
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    setIsLoading(true);
    await Promise.all([loadAuction(), loadBids(), loadEvents()]);
    setIsLoading(false);
  };

  const loadAuction = async () => {
    if (!id) return;
    const { data } = await getAuction(id);
    setAuction(data);
  };

  const loadBids = async () => {
    if (!id) return;
    const { data } = await getBidsForAuction(id);
    setBids(data || []);
  };

  const loadEvents = async () => {
    if (!id) return;
    const { data } = await getAuctionEvents(id);
    setEvents((data as typeof events) || []);
  };

  if (isLoading) return (
    <div style={{ minHeight: '100vh', background: '#050505', paddingTop: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 40, height: 40, border: '3px solid rgba(0,255,136,0.3)', borderTopColor: '#00ff88', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!auction) return (
    <div style={{ minHeight: '100vh', background: '#050505', paddingTop: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <h2 style={{ fontFamily: 'Outfit, sans-serif' }}>Auction Not Found</h2>
      <Link to="/dashboard" style={{ color: '#00ff88' }}>← Back to Dashboard</Link>
    </div>
  );

  const activeEnd = auction.status === 'commit' ? auction.commit_end : auction.reveal_end;
  const ctaConfig = {
    commit: { label: 'Place Sealed Bid', to: `/auction/${id}/commit`, color: 'linear-gradient(135deg, #00ff88, #00ccff)', textColor: '#000' },
    reveal: { label: 'Reveal Your Bid', to: `/auction/${id}/reveal`, color: 'linear-gradient(135deg, #ffcc00, #ff8800)', textColor: '#000' },
    ended: { label: 'View Results', to: `/auction/${id}/results`, color: 'rgba(255,255,255,0.1)', textColor: '#fff' },
    upcoming: { label: 'Auction Not Started', to: '#', color: 'rgba(255,255,255,0.05)', textColor: 'rgba(255,255,255,0.3)' },
    cancelled: { label: 'Cancelled', to: '#', color: 'rgba(255,77,77,0.1)', textColor: '#ff4d4d' },
  }[auction.status];

  return (
    <div style={{ minHeight: '100vh', background: '#050505', paddingTop: 64 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 80px' }}>
        <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', marginBottom: 28, fontSize: '0.875rem' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32, alignItems: 'start' }}>
          {/* Left: Image + Info */}
          <div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 24, background: '#111', aspectRatio: '16/9', position: 'relative' }}>
              <img src={auction.asset_image_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=60'} alt={auction.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(5,5,5,0.6) 0%, transparent 50%)' }} />
            </motion.div>

            {/* Auction Title */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                <PhaseBadge status={auction.status} size="md" />
                <span style={{ background: auction.auction_type === 'vickrey' ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${auction.auction_type === 'vickrey' ? 'rgba(0,255,136,0.3)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 100, padding: '4px 12px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: auction.auction_type === 'vickrey' ? '#00ff88' : '#a0a0a0' }}>
                  {auction.auction_type === 'vickrey' ? '⚡ Vickrey' : 'Standard'}
                </span>
              </div>
              <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', fontWeight: 800, marginBottom: 8 }}>{auction.title}</h1>
              <p style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, marginBottom: 16 }}>{auction.description}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>
                <ShieldCheck size={14} color="#00ff88" />
                Contract: <span style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.5)' }}>{shortenAddr(auction.contract_address)}</span>
                <a href={`https://sepolia.etherscan.io/address/${auction.contract_address}`} target="_blank" rel="noopener noreferrer" style={{ color: '#00ccff' }}><ExternalLink size={12} /></a>
              </div>
            </div>

            {/* Bid Table */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Users size={16} color="#00ff88" />
                <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>Bid Activity</span>
                <span style={{ background: 'rgba(0,255,136,0.1)', color: '#00ff88', borderRadius: 100, padding: '2px 10px', fontSize: '0.75rem', fontWeight: 700 }}>{bids.length}</span>
              </div>
              {bids.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.875rem' }}>No bids yet. Be the first!</div>
              ) : (
                <div>
                  {bids.map((bid, i) => (
                    <div key={bid.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: i < bids.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>{shortenAddr(bid.bidder_address)}</div>
                      <div style={{ fontSize: '0.78rem' }}>
                        {bid.status === 'revealed' && bid.revealed_amount_wei ? (
                          <span style={{ color: '#00ff88', fontWeight: 600 }}>{weiToEth(bid.revealed_amount_wei)} ETH</span>
                        ) : auction.status === 'commit' ? (
                          <span style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>████████ (hidden)</span>
                        ) : (
                          <span style={{ color: 'rgba(255,255,255,0.3)' }}>Not revealed</span>
                        )}
                      </div>
                      <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: '0.7rem', fontWeight: 600, background: bid.status === 'won' ? 'rgba(0,255,136,0.1)' : bid.status === 'revealed' ? 'rgba(0,204,255,0.1)' : 'rgba(255,255,255,0.05)', color: bid.status === 'won' ? '#00ff88' : bid.status === 'revealed' ? '#00ccff' : 'rgba(255,255,255,0.4)' }}>{bid.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Action Panel */}
          <div style={{ position: 'sticky', top: 84 }}>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '28px 24px' }}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Reserve Price</div>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2.2rem', fontWeight: 800 }}>{weiToEth(auction.reserve_price_wei)} <span style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.5)' }}>ETH</span></div>
              </div>

              {auction.status !== 'ended' && auction.status !== 'cancelled' && (
                <div style={{ marginBottom: 24, padding: '16px', background: 'rgba(255,255,255,0.04)', borderRadius: 12 }}>
                  <CountdownTimer
                    targetDate={activeEnd}
                    label={auction.status === 'commit' ? 'Commit Phase Ends' : 'Reveal Phase Ends'}
                  />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {[
                  ['Creator', auction.profiles?.display_name || 'Anonymous'],
                  ['Auction Type', auction.auction_type === 'vickrey' ? 'Vickrey (2nd Price)' : 'Standard'],
                  ['Total Bids', bids.length.toString()],
                  ['Chain', 'Sepolia Testnet'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>{k}</span>
                    <span style={{ fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>

              <button onClick={() => { if (ctaConfig && ctaConfig.to !== '#') navigate(ctaConfig.to); }}
                disabled={!ctaConfig || ctaConfig.to === '#'}
                style={{ width: '100%', padding: '15px', borderRadius: 12, border: 'none', background: ctaConfig?.color || 'rgba(255,255,255,0.1)', color: ctaConfig?.textColor || '#fff', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1rem', cursor: ctaConfig?.to !== '#' ? 'pointer' : 'not-allowed', transition: 'opacity 0.2s' }}>
                {ctaConfig?.label}
              </button>

              {auction.status === 'ended' && (
                <button onClick={() => navigate(`/auction/${id}/results`)} style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontFamily: 'Outfit, sans-serif', fontWeight: 600, cursor: 'pointer', marginTop: 10 }}>
                  Claim Refund
                </button>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionDetailPage;
