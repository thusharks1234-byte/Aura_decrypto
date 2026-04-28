import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Gavel, Plus, User, Menu, X, ChevronDown, LogOut, LayoutDashboard, BookOpen, Coins } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { useAuth } from '../contexts/AuthContext';
import { getDemoBalance } from '../lib/supabase';
import NotificationBell from './NotificationBell';

const shortenAddr = (a: string) => `${a.slice(0, 6)}...${a.slice(-4)}`;

const Navbar: React.FC = () => {
  const location = useLocation();
  const { address, isConnected, connect, isConnecting } = useWallet();
  const { user, profile, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [demoBalance, setDemoBalance] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      getDemoBalance(user.id).then(bal => setDemoBalance(bal));
    } else {
      setDemoBalance(null);
    }
  }, [user]);

  const navLinks = [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Create Auction', to: '/auction/create', icon: Plus },
    { label: 'Docs', to: '/docs', icon: BookOpen },
  ];

  const isActive = (to: string) => location.pathname === to || location.pathname.startsWith(to + '/');

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(5,5,5,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'linear-gradient(135deg, #00ff88, #00ccff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Gavel size={20} color="#000" />
            </div>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.35rem', color: '#fff', letterSpacing: '-0.02em' }}>
              SealBid
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="desktop-nav" style={{ alignItems: 'center', gap: 4, display: 'none' }}>
            {navLinks.map(link => (
                <Link key={link.to} to={link.to} className="interactive-hover" style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 8, textDecoration: 'none',
                  fontSize: '0.875rem', fontWeight: 500,
                  color: isActive(link.to) ? '#00ff88' : 'rgba(255,255,255,0.6)',
                  background: isActive(link.to) ? 'rgba(0,255,136,0.08)' : 'transparent',
                  transition: 'all 0.2s',
                }}>
                <link.icon size={15} />
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {user && demoBalance !== null && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,204,0,0.08)', border: '1px solid rgba(255,204,0,0.2)',
                borderRadius: 100, padding: '5px 12px',
                fontSize: '0.78rem', fontWeight: 700, color: '#ffcc00',
              }}>
                <Coins size={14} />
                {demoBalance.toFixed(2)} <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>DEMO</span>
              </div>
            )}

            <NotificationBell />

            {isConnected && address ? (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 100, padding: '7px 14px', cursor: 'pointer', color: '#fff',
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00ff88' }} />
                  <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{shortenAddr(address)}</span>
                  <ChevronDown size={14} style={{ color: 'rgba(255,255,255,0.4)', transform: profileOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.97 }}
                      style={{
                        position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 200,
                        background: '#111', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 12, overflow: 'hidden', zIndex: 200,
                      }}
                    >
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{profile?.display_name || 'User'}</div>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>{shortenAddr(address)}</div>
                      </div>
                      <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.875rem' }}
                        onClick={() => setProfileOpen(false)}>
                        <User size={15} /> My Profile
                      </Link>
                      <button onClick={() => { signOut(); setProfileOpen(false); }} style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', width: '100%',
                        background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '0.875rem',
                      }}>
                        <LogOut size={15} /> Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={connect}
                  disabled={isConnecting}
                  className="btn-primary interactive-hover"
                  style={{
                    background: 'linear-gradient(135deg, #00ff88, #00ccff)',
                    border: 'none', borderRadius: 8, padding: '9px 20px',
                    fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '0.875rem',
                    color: '#000', cursor: isConnecting ? 'wait' : 'pointer', whiteSpace: 'nowrap',
                  }}
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}

            <button onClick={() => setMobileOpen(true)}
                className="interactive-hover"
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}>
              <Menu size={22} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
            style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#080808', padding: 24 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
              <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.5rem' }}>SealBid</span>
              <button onClick={() => setMobileOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {navLinks.map(link => (
                <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderRadius: 12,
                    textDecoration: 'none', fontSize: '1.1rem', fontWeight: 600,
                    color: isActive(link.to) ? '#00ff88' : '#fff',
                    background: isActive(link.to) ? 'rgba(0,255,136,0.08)' : 'transparent',
                    transition: 'all 0.2s',
                  }}
                  className="interactive-hover">
                  <link.icon size={20} /> {link.label}
                </Link>
              ))}
              {!isConnected && (
                <button onClick={() => { connect(); setMobileOpen(false); }} style={{
                    marginTop: 20, padding: '16px', borderRadius: 12, border: 'none',
                    background: 'linear-gradient(135deg, #00ff88, #00ccff)',
                    color: '#000', fontWeight: 700, fontFamily: 'Outfit, sans-serif', fontSize: '1.1rem', cursor: 'pointer',
                    transition: 'transform 0.2s',
                  }}
                  className="btn-primary interactive-hover">
                  Connect Wallet
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
