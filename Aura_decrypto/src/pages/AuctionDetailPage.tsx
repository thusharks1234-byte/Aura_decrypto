import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ExternalLink, Users, ShieldCheck, Activity, ArrowUpRight, TrendingUp } from 'lucide-react';
import { getAuction, getBidsForAuction, placeBid, deductDemoBalance, getDemoBalance, logAuctionEvent, type Auction, type Bid } from '../lib/supabase';
import { weiToEth, ethToWei } from '../lib/crypto';
import PhaseBadge from '../components/PhaseBadge';
import CountdownTimer from '../components/CountdownTimer';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import AuthModal from '../components/AuthModal';

const shortenAddr = (a: string) => a ? `${a.slice(0, 8)}...${a.slice(-6)}` : '';

const AuctionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { address, connect } = useWallet();
  
  const [auction, setAuction] = useState<Auction | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [authOpen, setAuthOpen] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [isBidding, setIsBidding] = useState(false);
  const [error, setError] = useState('');
  const [demoBalance, setDemoBalance] = useState(0);

  useEffect(() => {
    if (!id) return;

    async function loadData() {
      setIsLoading(true);
      await Promise.all([loadAuction(), loadBids()]);
      setIsLoading(false);
    }
    async function loadAuction() {
      const { data } = await getAuction(id!);
      setAuction(data);
    }
    async function loadBids() {
      const { data } = await getBidsForAuction(id!);
      setBids(data || []);
    }

    loadData();

    // Subscribe to auction changes (status, winner, etc.)
    const auctionSub = supabase.channel(`auction_detail_${id}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'auctions', 
        filter: `id=eq.${id}` 
      }, (payload) => {
        setAuction(payload.new as Auction);
      })
      .subscribe();

    // Realtime subscription for bids
    const bidsSub = supabase.channel(`auction_bids_${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bids', filter: `auction_id=eq.${id}` },
        () => loadBids())
      .subscribe();

    return () => { 
      auctionSub.unsubscribe();
      bidsSub.unsubscribe(); 
    };
  }, [id]);

  useEffect(() => {
    if (user) {
      getDemoBalance(user.id).then(setDemoBalance);
    }
  }, [user]);

  const handlePlaceBid = async () => {
    if (!user) { setAuthOpen(true); return; }
    if (!auction) return;
    
    const isDemo = auction.is_demo;
    if (!isDemo && !address) { connect(); return; }
    if (!bidAmount || Number(bidAmount) <= 0) { setError('Enter a valid bid amount'); return; }
    
    // Check if bid is higher than current max
    const highestBidWei = bids.length > 0 ? Math.max(...bids.map(b => Number(b.revealed_amount_wei || 0))) : Number(auction.reserve_price_wei);
    const newBidWei = Number(ethToWei(bidAmount));
    
    if (newBidWei <= highestBidWei && bids.length > 0) {
      setError('Bid must be higher than the current highest bid');
      return;
    } else if (newBidWei < highestBidWei) {
      setError('Bid must be at least the reserve price');
      return;
    }

    setError('');
    setIsBidding(true);
    try {
      const bidderAddr = isDemo ? (address || `0xdemo${user.id.replace(/-/g, '').slice(0, 34)}`) : address!;
      
      if (isDemo) {
        const { success } = await deductDemoBalance(user.id, Number(bidAmount));
        if (!success) throw new Error(`Insufficient demo balance. You have ${demoBalance.toFixed(4)} DEMO ETH.`);
      }

      const { error: dbErr } = await placeBid({
        auction_id: auction.id,
        bidder_id: user.id,
        bidder_address: bidderAddr,
        deposit_wei: newBidWei.toString(),
        commit_tx_hash: isDemo ? `0xdemo_${Date.now().toString(16)}` : `0x${Math.random().toString(16).slice(2)}`,
        reveal_tx_hash: null,
      });

      if (dbErr) throw dbErr;
      await logAuctionEvent({ auction_id: auction.id, event_type: 'BidPlaced', actor_address: bidderAddr, data: { amount_wei: newBidWei.toString(), is_demo: isDemo } });
      setBidAmount('');
      
      if (user) {
        getDemoBalance(user.id).then(setDemoBalance);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to place bid');
    } finally {
      setIsBidding(false);
    }
  };

  if (isLoading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingTop: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 40, height: 40, border: '3px solid rgba(var(--accent-primary-rgb), 0.3)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!auction) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingTop: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <h2 style={{ fontFamily: 'Outfit, sans-serif' }}>Auction Not Found</h2>
      <Link to="/dashboard" style={{ color: 'var(--accent-primary)' }}>← Back to Dashboard</Link>
    </div>
  );

  const activeEnd = auction.commit_end; // For live auctions, commit_end is the true end
  const isEnded = auction.status === 'ended' || auction.status === 'cancelled';
  const highestBid = bids.length > 0 ? Math.max(...bids.map(b => Number(b.revealed_amount_wei || 0))) : 0;
  const currentPriceWei = highestBid > 0 ? highestBid.toString() : auction.reserve_price_wei;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingTop: 64 }}>
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 80px' }}>
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
          <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(var(--text-rgb), 0.4)', textDecoration: 'none', marginBottom: 28, fontSize: '0.875rem' }} className="interactive-hover">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 40, alignItems: 'start' }}>
          {/* Left: Image + Info */}
          <div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              style={{ borderRadius: 24, overflow: 'hidden', marginBottom: 32, background: 'var(--bg-secondary)', aspectRatio: '16/9', position: 'relative', border: '1px solid rgba(var(--text-rgb), 0.05)', boxShadow: '0 20px 40px rgba(var(--btn-text-rgb), 0.4)' }}>
              <motion.img 
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.6 }}
                src={auction.asset_image_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=60'} alt={auction.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(5,5,5,0.8) 0%, transparent 60%)', pointerEvents: 'none' }} />
              {!isEnded && (
                <div style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(var(--btn-text-rgb), 0.6)', backdropFilter: 'blur(10px)', padding: '8px 16px', borderRadius: 100, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid rgba(var(--accent-primary-rgb), 0.3)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-primary)', animation: 'pulse 2s infinite' }} />
                  <span style={{ color: 'var(--accent-primary)', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.05em' }}>LIVE</span>
                </div>
              )}
            </motion.div>

            {/* Auction Title */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                <PhaseBadge status={auction.status} size="md" />
                <span style={{ background: auction.auction_type === 'vickrey' ? 'rgba(var(--accent-primary-rgb), 0.1)' : 'rgba(var(--text-rgb), 0.05)', border: `1px solid ${auction.auction_type === 'vickrey' ? 'rgba(var(--accent-primary-rgb), 0.3)' : 'rgba(var(--text-rgb), 0.1)'}`, borderRadius: 100, padding: '6px 14px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: auction.auction_type === 'vickrey' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
                  {auction.auction_type === 'vickrey' ? '⚡ Vickrey' : 'Standard'}
                </span>
                <span style={{
                  background: auction.is_demo ? 'rgba(var(--warning-rgb), 0.15)' : 'rgba(var(--accent-primary-rgb), 0.1)',
                  border: `1px solid ${auction.is_demo ? 'rgba(var(--warning-rgb), 0.4)' : 'rgba(var(--accent-primary-rgb), 0.3)'}`,
                  borderRadius: 100, padding: '6px 14px', fontSize: '0.75rem', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                  color: auction.is_demo ? 'var(--warning)' : 'var(--accent-primary)',
                }}>
                  {auction.is_demo ? '⚗ Demo' : '● Live'}
                </span>
              </div>
              <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, marginBottom: 12, background: 'linear-gradient(to right, var(--text-primary), var(--text-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{auction.title}</h1>
              <p style={{ color: 'rgba(var(--text-rgb), 0.5)', lineHeight: 1.8, marginBottom: 20, fontSize: '1.05rem' }}>{auction.description}</p>
              
              <div style={{ display: 'flex', gap: 20, padding: '16px 20px', background: 'rgba(var(--text-rgb), 0.02)', borderRadius: 16, border: '1px solid rgba(var(--text-rgb), 0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'rgba(var(--text-rgb), 0.4)' }}>
                  <ShieldCheck size={16} color="var(--accent-primary)" />
                  Contract: <span style={{ fontFamily: 'monospace', color: 'rgba(var(--text-rgb), 0.7)' }}>{shortenAddr(auction.contract_address)}</span>
                  <a href={`https://sepolia.etherscan.io/address/${auction.contract_address}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-secondary)' }}><ExternalLink size={14} /></a>
                </div>
                <div style={{ width: 1, background: 'rgba(var(--text-rgb), 0.1)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'rgba(var(--text-rgb), 0.4)' }}>
                  <Users size={16} color="var(--accent-secondary)" />
                  Creator: <span style={{ fontFamily: 'monospace', color: 'rgba(var(--text-rgb), 0.7)' }}>{auction.profiles?.display_name || 'Anonymous'}</span>
                </div>
              </div>
            </div>

            {/* Live Bids Feed */}
            <div style={{ background: 'rgba(var(--text-rgb), 0.02)', border: '1px solid rgba(var(--text-rgb), 0.07)', borderRadius: 20, overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(var(--text-rgb), 0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(var(--text-rgb), 0.01)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Activity size={18} color="var(--accent-primary)" />
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.1rem' }}>Live Bids</span>
                  <span style={{ background: 'rgba(var(--accent-primary-rgb), 0.1)', color: 'var(--accent-primary)', borderRadius: 100, padding: '2px 10px', fontSize: '0.75rem', fontWeight: 700 }}>{bids.length}</span>
                </div>
              </div>
              
              <div style={{ maxHeight: 400, overflowY: 'auto', padding: '10px 0' }}>
                <AnimatePresence>
                  {bids.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '40px', textAlign: 'center', color: 'rgba(var(--text-rgb), 0.3)', fontSize: '0.9rem' }}>
                      No bids yet. Be the first to place a bid!
                    </motion.div>
                  ) : (
                    bids.map((bid, i) => (
                      <motion.div 
                        key={bid.id} 
                        initial={{ opacity: 0, y: -20, background: 'rgba(var(--accent-primary-rgb), 0.2)' }}
                        animate={{ opacity: 1, y: 0, background: 'transparent' }}
                        transition={{ duration: 0.5 }}
                        whileHover={{ background: 'rgba(var(--text-rgb), 0.03)' }}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: i < bids.length - 1 ? '1px solid rgba(var(--text-rgb), 0.04)' : 'none', transition: 'background 0.2s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {i === 0 && !isEnded && <TrendingUp size={16} color="var(--accent-primary)" />}
                          <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: i === 0 ? 'var(--text-primary)' : 'rgba(var(--text-rgb), 0.5)', fontWeight: i === 0 ? 600 : 400 }}>
                            {shortenAddr(bid.bidder_address)}
                            {bid.bidder_id === user?.id && <span style={{ marginLeft: 8, fontSize: '0.7rem', background: 'rgba(var(--accent-secondary-rgb), 0.1)', color: 'var(--accent-secondary)', padding: '2px 6px', borderRadius: 4 }}>YOU</span>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ color: i === 0 ? 'var(--accent-primary)' : 'rgba(var(--text-rgb), 0.6)', fontWeight: 700, fontSize: '1rem', fontFamily: 'Outfit, sans-serif' }}>
                            {weiToEth(bid.revealed_amount_wei || bid.deposit_wei)} ETH
                          </span>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Right: Action Panel */}
          <div style={{ position: 'sticky', top: 96 }}>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ background: 'linear-gradient(180deg, rgba(var(--text-rgb), 0.03) 0%, rgba(var(--text-rgb), 0.01) 100%)', border: '1px solid rgba(var(--text-rgb), 0.08)', borderRadius: 24, padding: '32px 28px', boxShadow: '0 20px 40px rgba(var(--btn-text-rgb), 0.2)' }}>
              <div style={{ marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid rgba(var(--text-rgb), 0.06)' }}>
                <div style={{ fontSize: '0.75rem', color: 'rgba(var(--text-rgb), 0.4)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {bids.length > 0 ? 'Current Price' : 'Reserve Price'}
                </div>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '3rem', fontWeight: 800, lineHeight: 1, background: 'linear-gradient(135deg, var(--text-primary), var(--text-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {weiToEth(currentPriceWei)} <span style={{ fontSize: '1.2rem', color: 'rgba(var(--text-rgb), 0.4)', fontWeight: 600, WebkitTextFillColor: 'rgba(var(--text-rgb), 0.4)' }}>ETH</span>
                </div>
              </div>

              {!isEnded && (
                <div style={{ marginBottom: 32, padding: '16px 20px', background: 'rgba(var(--accent-primary-rgb), 0.05)', border: '1px solid rgba(var(--accent-primary-rgb), 0.1)', borderRadius: 16 }}>
                  <CountdownTimer targetDate={activeEnd} label="Auction ends in" />
                </div>
              )}

              {/* Bidding Section */}
              {!isEnded ? (
                <div style={{ marginBottom: 24 }}>
                  {error && <div style={{ background: 'rgba(var(--error-rgb), 0.1)', border: '1px solid rgba(var(--error-rgb), 0.3)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, color: '#ff6b6b', fontSize: '0.85rem' }}>{error}</div>}
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input 
                        type="number" 
                        min="0" 
                        step="0.001" 
                        placeholder={`> ${weiToEth(currentPriceWei)}`}
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        style={{ width: '100%', background: 'rgba(var(--btn-text-rgb), 0.3)', border: '1px solid rgba(var(--text-rgb), 0.1)', borderRadius: 12, padding: '16px 20px', color: 'var(--text-primary)', outline: 'none', fontSize: '1.1rem', fontFamily: 'monospace', transition: 'border 0.2s' }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
                        onBlur={(e) => e.target.style.borderColor = 'rgba(var(--text-rgb), 0.1)'}
                      />
                      <div style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', color: 'rgba(var(--text-rgb), 0.3)', fontWeight: 600, fontSize: '0.9rem' }}>ETH</div>
                    </div>
                  </div>

                  <motion.button 
                    whileHover={{ scale: 1.02, boxShadow: '0 0 24px rgba(var(--accent-primary-rgb), 0.25)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePlaceBid}
                    disabled={isBidding}
                    style={{ width: '100%', padding: '16px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', color: 'var(--btn-text)', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.1rem', cursor: isBidding ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {isBidding ? 'Placing Bid...' : <>Place Bid <ArrowUpRight size={20} /></>}
                  </motion.button>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'rgba(var(--text-rgb), 0.4)' }}>
                      <Activity size={12} />
                      Estimated Gas: <span style={{ color: 'var(--text-secondary)' }}>~0.0005 ETH</span>
                    </div>
                    {user && auction.is_demo && (
                      <div style={{ fontSize: '0.8rem', color: 'rgba(var(--text-rgb), 0.4)' }}>
                        Demo Balance: <span style={{ color: 'var(--warning)', fontWeight: 600 }}>{demoBalance.toFixed(3)} ETH</span>
                      </div>
                    )}
                  </div>

                  {!auction.is_demo && (
                    <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(var(--accent-primary-rgb), 0.05)', borderRadius: 8, fontSize: '0.7rem', color: 'rgba(var(--text-rgb), 0.5)', border: '1px solid rgba(var(--accent-primary-rgb), 0.1)' }}>
                      Note: This is a <strong>Live</strong> auction. Placing a bid requires a Sepolia ETH transaction and gas fees.
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ marginBottom: 24, padding: '24px', background: 'rgba(var(--text-rgb), 0.03)', borderRadius: 16, textAlign: 'center' }}>
                  <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.2rem', marginBottom: 8, color: 'var(--text-primary)' }}>Auction Ended</h3>
                  {auction.winner_address ? (
                    <div>
                      <p style={{ color: 'rgba(var(--text-rgb), 0.4)', fontSize: '0.9rem', marginBottom: 12 }}>Winning Bid: <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>{weiToEth(auction.winning_bid_wei || '0')} ETH</span></p>
                      <p style={{ color: 'rgba(var(--text-rgb), 0.4)', fontSize: '0.9rem' }}>Winner: <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{shortenAddr(auction.winner_address)}</span></p>
                    </div>
                  ) : (
                    <p style={{ color: 'rgba(var(--text-rgb), 0.4)', fontSize: '0.9rem' }}>No bids were placed.</p>
                  )}
                </div>
              )}

              {auction.status === 'ended' && (
                <button onClick={() => navigate(`/auction/${id}/results`)} style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid rgba(var(--text-rgb), 0.1)', background: 'transparent', color: 'rgba(var(--text-rgb), 0.6)', fontFamily: 'Outfit, sans-serif', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s', ...({ '&:hover': { background: 'rgba(var(--text-rgb), 0.05)' } } as React.CSSProperties) }}>
                  View Full Results
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
