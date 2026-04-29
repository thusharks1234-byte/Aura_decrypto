import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Medal, RotateCcw, CheckCircle } from 'lucide-react';
import { getAuction, getBidsForAuction, type Auction, type Bid } from '../lib/supabase';
import { weiToEth } from '../lib/crypto';
import PhaseBadge from '../components/PhaseBadge';

const shortenAddr = (a: string) => a ? `${a.slice(0, 8)}...${a.slice(-6)}` : '';

const ResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      getAuction(id).then(({ data }) => setAuction(data)),
      getBidsForAuction(id).then(({ data }) => setBids(data || [])),
    ]).finally(() => setIsLoading(false));
  }, [id]);

  const validBids = bids
    .filter(b => b.status === 'placed' || b.status === 'revealed' || b.status === 'won')
    .sort((a, b) => Number(BigInt(b.revealed_amount_wei || b.deposit_wei || '0') - BigInt(a.revealed_amount_wei || a.deposit_wei || '0')));

  const winner = validBids[0];
  const secondPrice = validBids[1];
  const pricePaid = auction?.auction_type === 'vickrey' && secondPrice
    ? (secondPrice.revealed_amount_wei || secondPrice.deposit_wei)
    : (winner?.revealed_amount_wei || winner?.deposit_wei);

  if (isLoading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingTop: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 40, height: 40, border: '3px solid rgba(var(--accent-primary-rgb), 0.3)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!auction) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingTop: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <h2 style={{ fontFamily: 'Outfit, sans-serif' }}>Auction Not Found</h2>
      <Link to="/dashboard" style={{ color: 'var(--accent-primary)' }}>← Dashboard</Link>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingTop: 64 }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 80px' }}>
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
          <Link to={`/auction/${id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(var(--text-rgb), 0.4)', textDecoration: 'none', marginBottom: 28, fontSize: '0.875rem' }} className="interactive-hover">
            <ArrowLeft size={16} /> Back to Auction
          </Link>
        </motion.div>

        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <PhaseBadge status={auction.status} size="md" />
          </div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(1.6rem, 3vw, 2.5rem)', fontWeight: 800, marginBottom: 6 }}>{auction.title}</h1>
          <p style={{ color: 'rgba(var(--text-rgb), 0.4)' }}>Auction Results & Verification</p>
        </div>

        {/* Winner Banner */}
        {winner ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01, boxShadow: '0 8px 32px rgba(var(--accent-primary-rgb), 0.1)' }}
            style={{ background: 'linear-gradient(135deg, rgba(var(--accent-primary-rgb), 0.1), rgba(var(--accent-secondary-rgb), 0.1))', border: '1px solid rgba(var(--accent-primary-rgb), 0.3)', borderRadius: 20, padding: '32px 28px', marginBottom: 28, position: 'relative', overflow: 'hidden', cursor: 'default', transition: 'box-shadow 0.3s' }}>
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              style={{ position: 'absolute', top: -30, right: -30, fontSize: '8rem', opacity: 0.05 }}>🏆</motion.div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trophy size={28} color="var(--btn-text)" />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(var(--text-rgb), 0.4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>Winner</div>
                <div style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 700 }}>{shortenAddr(winner.bidder_address)}</div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'rgba(var(--text-rgb), 0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                  {auction.auction_type === 'vickrey' ? 'Price Paid (2nd)' : 'Price Paid'}
                </div>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2rem', fontWeight: 800, background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {pricePaid ? weiToEth(pricePaid) : weiToEth(winner.revealed_amount_wei || '0')} ETH
                </div>
                {auction.auction_type === 'vickrey' && (
                  <div style={{ fontSize: '0.8rem', color: 'rgba(var(--text-rgb), 0.4)' }}>Bid: {weiToEth(winner.revealed_amount_wei || winner.deposit_wei || '0')} ETH</div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <div style={{ background: 'rgba(var(--text-rgb), 0.03)', border: '1px solid rgba(var(--text-rgb), 0.08)', borderRadius: 16, padding: '24px', marginBottom: 28, textAlign: 'center', color: 'rgba(var(--text-rgb), 0.4)' }}>
            {auction.status !== 'ended' ? 'Auction still in progress — results will appear here when it ends.' : 'No valid bids were placed for this auction.'}
          </div>
        )}

        {/* Leaderboard */}
        <div style={{ background: 'rgba(var(--text-rgb), 0.02)', border: '1px solid rgba(var(--text-rgb), 0.07)', borderRadius: 16, overflow: 'hidden', marginBottom: 24 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(var(--text-rgb), 0.07)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Medal size={16} color="var(--warning)" />
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>Bid Leaderboard</span>
          </div>
          {validBids.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(var(--text-rgb), 0.3)', fontSize: '0.875rem' }}>No bids were placed.</div>
          ) : (
            validBids.map((bid, i) => (
              <motion.div 
                key={bid.id} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ background: 'rgba(var(--text-rgb), 0.04)' }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
                  borderBottom: i < validBids.length - 1 ? '1px solid rgba(var(--text-rgb), 0.04)' : 'none',
                  background: i === 0 ? 'rgba(var(--accent-primary-rgb), 0.03)' : 'transparent',
                  transition: 'background 0.2s'
                }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: i === 0 ? 'linear-gradient(135deg, var(--warning), #ff8800)' : i === 1 ? 'rgba(192,192,192,0.2)' : 'rgba(var(--text-rgb), 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', color: i === 0 ? 'var(--btn-text)' : i === 1 ? '#c0c0c0' : 'rgba(var(--text-rgb), 0.4)', flexShrink: 0 }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>{shortenAddr(bid.bidder_address)}</div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(var(--text-rgb), 0.3)', marginTop: 2 }}>
                    {bid.revealed_at ? new Date(bid.revealed_at).toLocaleString() : new Date(bid.created_at).toLocaleString()}
                  </div>
                </div>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: i === 0 ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                  {weiToEth(bid.revealed_amount_wei || bid.deposit_wei || '0')} ETH
                </div>
                {i === 0 && <span style={{ padding: '3px 10px', borderRadius: 100, background: 'rgba(var(--accent-primary-rgb), 0.15)', color: 'var(--accent-primary)', fontSize: '0.7rem', fontWeight: 700 }}>WINNER</span>}
              </motion.div>
            ))
          )}
        </div>

        {/* Refund Panel */}
        <div style={{ background: 'rgba(var(--text-rgb), 0.02)', border: '1px solid rgba(var(--text-rgb), 0.07)', borderRadius: 16, padding: '24px 20px', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <RotateCcw size={16} color="var(--accent-secondary)" />
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>Refund Claims</span>
          </div>
          {bids.filter(b => b.status === 'lost' || b.status === 'refund_pending').length === 0 ? (
            <p style={{ color: 'rgba(var(--text-rgb), 0.3)', fontSize: '0.875rem' }}>No pending refunds to display.</p>
          ) : (
            bids.filter(b => b.status === 'lost' || b.status === 'refund_pending').map(bid => (
              <div key={bid.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(var(--text-rgb), 0.05)' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'rgba(var(--text-rgb), 0.5)' }}>{shortenAddr(bid.bidder_address)}</span>
                <span style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>{weiToEth(bid.deposit_wei)} ETH</span>
                <motion.button 
                  whileHover={{ scale: 1.05, background: 'rgba(var(--accent-secondary-rgb), 0.2)' }}
                  whileTap={{ scale: 0.95 }}
                  style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: 'rgba(var(--accent-secondary-rgb), 0.1)', color: 'var(--accent-secondary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                  Claim
                </motion.button>
              </div>
            ))
          )}
          <p style={{ fontSize: '0.75rem', color: 'rgba(var(--text-rgb), 0.2)', marginTop: 12 }}>
            Refunds use pull-payment pattern (CEI compliant). In production, call claimRefund() on the smart contract.
          </p>
        </div>

        {/* Verification Panel */}
        <div style={{ background: 'rgba(var(--text-rgb), 0.02)', border: '1px solid rgba(var(--text-rgb), 0.07)', borderRadius: 16, padding: '24px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <CheckCircle size={16} color="var(--accent-primary)" />
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>On-Chain Verification</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'rgba(var(--text-rgb), 0.4)', lineHeight: 1.7 }}>
            All bids and payments are verifiable on Sepolia testnet. The winner is determined purely by on-chain logic — no off-chain authority.
          </p>
          <a href={`https://sepolia.etherscan.io/address/${auction.contract_address}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 12, color: 'var(--accent-secondary)', fontSize: '0.875rem', textDecoration: 'none' }}>
            View Contract on Etherscan →
          </a>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
