import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetDate: string;
  label?: string;
  onExpire?: () => void;
  compact?: boolean;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate, label, onExpire, compact = false }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        onExpire?.();
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
        expired: false,
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [targetDate, onExpire]);

  if (timeLeft.expired) return (
    <span style={{ color: '#ff4d4d', fontSize: '0.8rem', fontWeight: 700 }}>EXPIRED</span>
  );

  if (compact) return (
    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#00ff88' }}>
      {timeLeft.days > 0 && `${timeLeft.days}d `}
      {String(timeLeft.hours).padStart(2,'0')}:{String(timeLeft.minutes).padStart(2,'0')}:{String(timeLeft.seconds).padStart(2,'0')}
    </span>
  );

  return (
    <div>
      {label && <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{label}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        {timeLeft.days > 0 && (
          <div style={unitStyle}>
            <span style={numStyle}>{String(timeLeft.days).padStart(2,'0')}</span>
            <span style={labelStyle}>Days</span>
          </div>
        )}
        <div style={unitStyle}>
          <span style={numStyle}>{String(timeLeft.hours).padStart(2,'0')}</span>
          <span style={labelStyle}>Hrs</span>
        </div>
        <div style={unitStyle}>
          <span style={numStyle}>{String(timeLeft.minutes).padStart(2,'0')}</span>
          <span style={labelStyle}>Min</span>
        </div>
        <div style={unitStyle}>
          <span style={numStyle}>{String(timeLeft.seconds).padStart(2,'0')}</span>
          <span style={labelStyle}>Sec</span>
        </div>
      </div>
    </div>
  );
};

const unitStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  padding: '8px 12px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  minWidth: 50,
};

const numStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '1.4rem',
  fontWeight: 700,
  color: '#00ff88',
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.6rem',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'rgba(255,255,255,0.4)',
  marginTop: 2,
};

export default CountdownTimer;
