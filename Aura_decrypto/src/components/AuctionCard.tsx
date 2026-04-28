import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Auction } from '../lib/supabase';
import CountdownTimer from './CountdownTimer';
import PhaseBadge from './PhaseBadge';
import { weiToEth } from '../lib/crypto';

interface AuctionCardProps {
  auction: Auction;
}

const AuctionCard: React.FC<AuctionCardProps> = ({ auction }) => {
  const navigate = useNavigate();
  const activeEnd = auction.status === 'commit' ? auction.commit_end : auction.reveal_end;

  const ctaLabel = () => {
    switch (auction.status) {
      case 'commit': return 'Place Sealed Bid →';
      case 'reveal': return 'Reveal Your Bid →';
      case 'ended': return 'View Results →';
      default: return 'View Auction →';
    }
  };

  const ctaPath = () => {
    switch (auction.status) {
      case 'commit': return `/auction/${auction.id}/commit`;
      case 'reveal': return `/auction/${auction.id}/reveal`;
      case 'ended': return `/auction/${auction.id}/results`;
      default: return `/auction/${auction.id}`;
    }
  };

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 200 }}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'box-shadow 0.3s ease',
      }}
      onClick={() => navigate(`/auction/${auction.id}`)}
    >
      {/* Image */}
      <div style={{ position: 'relative', height: 220, overflow: 'hidden', background: '#111' }}>
        <img
          src={auction.asset_image_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60'}
          alt={auction.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
          onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.08)')}
          onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(5,5,5,0.8) 0%, transparent 60%)' }} />
        <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <PhaseBadge status={auction.status} />
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '3px 9px', borderRadius: 100, fontSize: '0.6rem', fontWeight: 800,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            background: auction.is_demo ? 'rgba(255,204,0,0.85)' : 'rgba(0,255,136,0.85)',
            color: '#000', backdropFilter: 'blur(6px)',
          }}>
            {auction.is_demo ? '⚗ DEMO' : '● LIVE'}
          </span>
        </div>
        <div style={{
          position: 'absolute', top: 12, right: 12,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 100, padding: '3px 10px',
          fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.1em', color: auction.auction_type === 'vickrey' ? '#00ff88' : '#a0a0a0',
        }}>
          {auction.auction_type === 'vickrey' ? '⚡ Vickrey' : 'Standard'}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '20px 24px 24px' }}>
        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>
          by {auction.profiles?.display_name || 'Anonymous'}
        </div>
        <h3 style={{ fontSize: '1.15rem', fontFamily: 'Outfit, sans-serif', fontWeight: 700, marginBottom: 8, lineHeight: 1.2 }}>
          {auction.title}
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginBottom: 16, lineHeight: 1.5,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {auction.description}
        </p>

        {/* Reserve + Timer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Reserve</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'monospace' }}>{weiToEth(auction.reserve_price_wei)} ETH</div>
          </div>
          {auction.status !== 'ended' && auction.status !== 'cancelled' && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Ends In</div>
              <CountdownTimer targetDate={activeEnd} compact />
            </div>
          )}
        </div>

        <button
          onClick={e => { e.stopPropagation(); navigate(ctaPath()); }}
          style={{
            width: '100%', padding: '12px', borderRadius: 10, border: 'none',
            background: auction.status === 'commit' ? 'linear-gradient(135deg, #00ff88, #00ccff)' :
                        auction.status === 'reveal' ? 'linear-gradient(135deg, #ffcc00, #ff8800)' :
                        'rgba(255,255,255,0.1)',
            color: (auction.status === 'commit' || auction.status === 'reveal') ? '#000' : '#fff',
            fontWeight: 700, fontFamily: 'Outfit, sans-serif', fontSize: '0.9rem', cursor: 'pointer',
            transition: 'opacity 0.2s',
          }}
        >
          {ctaLabel()}
        </button>
      </div>
    </motion.div>
  );
};

export default AuctionCard;
