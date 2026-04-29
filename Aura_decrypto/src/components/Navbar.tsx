import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Gavel, Plus, User, Menu, X, ChevronDown, LogOut, LayoutDashboard, BookOpen, Coins, Sun, Moon, Mail } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getDemoBalance } from '../lib/supabase';
import { supabase } from '../lib/supabaseClient';
import NotificationBell from './NotificationBell';

const shortenAddr = (a: string) => `${a.slice(0, 6)}...${a.slice(-4)}`;

const Navbar: React.FC = () => {
  const location = useLocation();
  const { address, isConnected, connect, isConnecting } = useWallet();
  const { user, profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [demoBalance, setDemoBalance] = useState<number | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (user) {
      getDemoBalance(user.id).then(bal => setDemoBalance(bal));
    } else {
      const timer = setTimeout(() => setDemoBalance(null), 0);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const navLinks = [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Create Auction', to: '/auction/create', icon: Plus },
    { label: 'Docs', to: '/docs', icon: BookOpen },
  ];

  const isActive = (to: string) => location.pathname === to || location.pathname.startsWith(to + '/');

  const handleGoogleLogin = async () => {
    try {
      setIsLoggingIn(true);
      setAuthError('');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '494573867848-d0t15j0u6cpd4elle9njj1ncbu6i0m85.apps.googleusercontent.com',
          }
        }
      });
      if (error) throw error;
    } catch (err: unknown) {
      console.error('Login error:', err);
      setAuthError(err instanceof Error ? err.message : 'Failed to initialize Google login.');
      setIsLoggingIn(false);
    }
  };

  const handleGmailLogin = async () => {
    try {
      setIsLoggingIn(true);
      setAuthError('');
      // Requesting Gmail API scopes specifically for the Gmail login
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          scopes: 'https://www.googleapis.com/auth/gmail.readonly',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '494573867848-d0t15j0u6cpd4elle9njj1ncbu6i0m85.apps.googleusercontent.com',
          }
        }
      });
      if (error) throw error;
    } catch (err: unknown) {
      console.error('Gmail Login error:', err);
      setAuthError(err instanceof Error ? err.message : 'Failed to initialize Gmail login.');
      setIsLoggingIn(false);
    }
  };

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(5,5,5,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(var(--text-rgb), 0.07)',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Gavel size={20} color="var(--btn-text)" />
            </div>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.35rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Aura Decrypto
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="desktop-nav" style={{ alignItems: 'center', gap: 4, display: 'none' }}>
            {navLinks.map(link => (
                <Link key={link.to} to={link.to} className="interactive-hover" style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 8, textDecoration: 'none',
                  fontSize: '0.875rem', fontWeight: 500,
                  color: isActive(link.to) ? 'var(--accent-primary)' : 'rgba(var(--text-rgb), 0.6)',
                  background: isActive(link.to) ? 'rgba(var(--accent-primary-rgb), 0.08)' : 'transparent',
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
                background: 'rgba(var(--warning-rgb), 0.08)', border: '1px solid rgba(var(--warning-rgb), 0.2)',
                borderRadius: 100, padding: '5px 12px',
                fontSize: '0.78rem', fontWeight: 700, color: 'var(--warning)',
              }}>
                <Coins size={14} />
                {demoBalance.toFixed(2)} <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>DEMO</span>
              </div>
            )}

            <NotificationBell />

            <button onClick={toggleTheme} className="interactive-hover" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-color)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', cursor: 'pointer' }}>
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {user ? (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: 'rgba(var(--text-rgb), 0.05)', border: '1px solid rgba(var(--text-rgb), 0.1)',
                    borderRadius: 100, padding: '5px 14px 5px 5px', cursor: 'pointer', color: 'var(--text-primary)',
                  }}
                >
                  <img src={user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user.email || 'U'}&background=7C3AED&color=fff`} alt="Avatar" style={{ width: 26, height: 26, borderRadius: '50%' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.email ? (user.email.length > 15 ? user.email.slice(0, 15) + '...' : user.email) : 'User'}</span>
                  <ChevronDown size={14} style={{ color: 'rgba(var(--text-rgb), 0.4)', transform: profileOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.97 }}
                      style={{
                        position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 200,
                        background: 'var(--bg-secondary)', border: '1px solid rgba(var(--text-rgb), 0.1)',
                        borderRadius: 12, overflow: 'hidden', zIndex: 200,
                      }}
                    >
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(var(--text-rgb), 0.07)' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{profile?.display_name || 'User'}</div>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(var(--text-rgb), 0.4)', fontFamily: 'monospace' }}>{user.email}</div>
                      </div>
                      <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', color: 'rgba(var(--text-rgb), 0.7)', textDecoration: 'none', fontSize: '0.875rem' }}
                        onClick={() => setProfileOpen(false)}>
                        <User size={15} /> My Profile
                      </Link>
                      <button onClick={() => { signOut(); setProfileOpen(false); }} style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', width: '100%',
                        background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '0.875rem',
                      }}>
                        <LogOut size={15} /> Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : isConnected && address ? (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: 'rgba(var(--text-rgb), 0.05)', border: '1px solid rgba(var(--text-rgb), 0.1)',
                    borderRadius: 100, padding: '7px 14px', cursor: 'pointer', color: 'var(--text-primary)',
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-primary)' }} />
                  <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{shortenAddr(address)}</span>
                  <ChevronDown size={14} style={{ color: 'rgba(var(--text-rgb), 0.4)', transform: profileOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.97 }}
                      style={{
                        position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 200,
                        background: 'var(--bg-secondary)', border: '1px solid rgba(var(--text-rgb), 0.1)',
                        borderRadius: 12, overflow: 'hidden', zIndex: 200,
                      }}
                    >
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(var(--text-rgb), 0.07)' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Web3 Wallet</div>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(var(--text-rgb), 0.4)', fontFamily: 'monospace' }}>{shortenAddr(address)}</div>
                        <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)', color: '#8b5cf6', padding: '3px 8px', borderRadius: 100, fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#8b5cf6', boxShadow: '0 0 6px #8b5cf6' }} />
                          Sepolia Testnet
                        </div>
                      </div>
                      <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', color: 'rgba(var(--text-rgb), 0.7)', textDecoration: 'none', fontSize: '0.875rem' }}
                        onClick={() => setProfileOpen(false)}>
                        <User size={15} /> My Profile
                      </Link>
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
                    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                    border: 'none', borderRadius: 8, padding: '9px 20px',
                    fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '0.875rem',
                    color: 'var(--btn-text)', cursor: isConnecting ? 'wait' : 'pointer', whiteSpace: 'nowrap',
                  }}
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}

            <button onClick={() => setMobileOpen(!mobileOpen)}
                className="interactive-hover"
                style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AnimatePresence mode="wait">
                {mobileOpen ? (
                  <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <X size={24} color="#7C3AED" />
                  </motion.div>
                ) : (
                  <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <Menu size={24} />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </nav>

      {/* Slide-in Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9998 }}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30, duration: 0.3 }}
              style={{ 
                position: 'fixed', top: 0, bottom: 0, right: 0, width: 340, maxWidth: '100vw', 
                zIndex: 9999, background: 'rgba(11, 15, 26, 0.85)', backdropFilter: 'blur(20px)', 
                borderLeft: '1px solid rgba(124, 58, 237, 0.2)', padding: 32, display: 'flex', flexDirection: 'column' 
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: '#fff' }}>Sign In</span>
                <button onClick={() => setMobileOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '50%', transition: 'background 0.2s' }} className="interactive-hover"><X size={24} /></button>
              </div>
              
              <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', marginBottom: 32 }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {authError && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '10px 14px', borderRadius: 8, fontSize: '0.85rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    {authError}
                  </div>
                )}
                <button onClick={handleGoogleLogin} disabled={isLoggingIn} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 100, padding: '14px 20px', color: '#fff', fontSize: '1rem', fontWeight: 600, cursor: isLoggingIn ? 'wait' : 'pointer', transition: 'all 0.2s', opacity: isLoggingIn ? 0.7 : 1 }} className={!isLoggingIn ? "interactive-hover" : ""}>
                  <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  {isLoggingIn ? 'Connecting...' : 'Continue with Google'}
                </button>

                <button onClick={handleGmailLogin} disabled={isLoggingIn} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 100, padding: '14px 20px', color: '#fff', fontSize: '1rem', fontWeight: 600, cursor: isLoggingIn ? 'wait' : 'pointer', transition: 'all 0.2s', opacity: isLoggingIn ? 0.7 : 1 }} className={!isLoggingIn ? "interactive-hover" : ""}>
                  <Mail size={24} color="#EA4335" />
                  {isLoggingIn ? 'Connecting...' : 'Continue with Gmail'}
                </button>
              </div>

              <div style={{ marginTop: 'auto', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', lineHeight: 1.5 }}>
                By continuing, you agree to our Terms & Privacy Policy.
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
