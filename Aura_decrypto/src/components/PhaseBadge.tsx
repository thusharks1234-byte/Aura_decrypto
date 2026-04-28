import React from 'react';
import type { Auction } from '../lib/supabase';

const phaseConfig = {
  upcoming: { label: 'Upcoming', color: '#a0a0a0', bg: 'rgba(160,160,160,0.1)', border: 'rgba(160,160,160,0.2)' },
  commit: { label: 'Commit Phase', color: '#00ccff', bg: 'rgba(0,204,255,0.1)', border: 'rgba(0,204,255,0.3)' },
  reveal: { label: 'Reveal Phase', color: '#ffcc00', bg: 'rgba(255,204,0,0.1)', border: 'rgba(255,204,0,0.3)' },
  ended: { label: 'Ended', color: '#00ff88', bg: 'rgba(0,255,136,0.1)', border: 'rgba(0,255,136,0.3)' },
  cancelled: { label: 'Cancelled', color: '#ff4d4d', bg: 'rgba(255,77,77,0.1)', border: 'rgba(255,77,77,0.3)' },
};

interface PhaseBadgeProps {
  status: Auction['status'];
  size?: 'sm' | 'md';
}

const PhaseBadge: React.FC<PhaseBadgeProps> = ({ status, size = 'sm' }) => {
  const cfg = phaseConfig[status] || phaseConfig.upcoming;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      borderRadius: 100,
      padding: size === 'sm' ? '3px 10px' : '6px 16px',
      fontSize: size === 'sm' ? '0.65rem' : '0.8rem',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      color: cfg.color,
    }}>
      <span style={{
        width: size === 'sm' ? 6 : 8,
        height: size === 'sm' ? 6 : 8,
        borderRadius: '50%',
        background: cfg.color,
        animation: (status === 'commit' || status === 'reveal') ? 'pulse 2s infinite' : undefined,
      }} />
      {cfg.label}
    </span>
  );
};

export default PhaseBadge;
