import React from 'react';
import type { Auction } from '../lib/supabase';

type PhaseConfig = { label: string; color: string; bg: string; border: string };
const phaseConfig: Record<string, PhaseConfig> = {
  upcoming: { label: 'Upcoming', color: 'var(--text-secondary)', bg: 'rgba(160,160,160,0.1)', border: 'rgba(160,160,160,0.2)' },
  active: { label: 'Live Auction', color: 'var(--accent-primary)', bg: 'rgba(var(--accent-primary-rgb), 0.1)', border: 'rgba(var(--accent-primary-rgb), 0.3)' },
  commit: { label: 'Live Auction', color: 'var(--accent-primary)', bg: 'rgba(var(--accent-primary-rgb), 0.1)', border: 'rgba(var(--accent-primary-rgb), 0.3)' },
  reveal: { label: 'Ending Soon', color: 'var(--warning)', bg: 'rgba(var(--warning-rgb), 0.1)', border: 'rgba(var(--warning-rgb), 0.3)' },
  ended: { label: 'Ended', color: 'var(--text-secondary)', bg: 'rgba(var(--text-rgb), 0.05)', border: 'rgba(var(--text-rgb), 0.1)' },
  cancelled: { label: 'Cancelled', color: 'var(--error)', bg: 'rgba(var(--error-rgb), 0.1)', border: 'rgba(var(--error-rgb), 0.3)' },
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
        animation: (status === 'active' || status === 'commit' || status === 'reveal') ? 'pulse 2s infinite' : undefined,
      }} />
      {cfg.label}
    </span>
  );
};

export default PhaseBadge;
