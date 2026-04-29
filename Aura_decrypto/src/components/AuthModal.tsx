import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) setError(error);
      else onClose();
    } else {
      const { error } = await signUp(email, password, displayName);
      if (error) setError(error);
      else setSuccess('Check your email to confirm your account!');
    }
    setLoading(false);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(var(--text-rgb), 0.05)', border: '1px solid rgba(var(--text-rgb), 0.1)',
    borderRadius: 10, padding: '12px 16px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem', marginBottom: 12,
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(var(--btn-text-rgb), 0.8)', backdropFilter: 'blur(8px)', zIndex: 300 }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            style={{
              position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
              zIndex: 301, width: '100%', maxWidth: 420, background: '#0f0f0f',
              border: '1px solid rgba(var(--text-rgb), 0.1)', borderRadius: 20, padding: '32px 28px',
            }}
          >
            <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'rgba(var(--text-rgb), 0.5)', cursor: 'pointer' }}>
              <X size={20} />
            </button>

            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5rem', fontWeight: 800, marginBottom: 8 }}>
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p style={{ color: 'rgba(var(--text-rgb), 0.4)', fontSize: '0.875rem', marginBottom: 24 }}>
              {mode === 'login' ? 'Sign in to access your auctions' : 'Join the sealed-bid revolution'}
            </p>

            {error && (
              <div style={{ background: 'rgba(var(--error-rgb), 0.1)', border: '1px solid rgba(var(--error-rgb), 0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: '0.85rem', color: '#ff6b6b' }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ background: 'rgba(var(--accent-primary-rgb), 0.1)', border: '1px solid rgba(var(--accent-primary-rgb), 0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: '0.85rem', color: 'var(--accent-primary)' }}>
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {mode === 'register' && (
                <input
                  type="text" placeholder="Display Name" value={displayName}
                  onChange={e => setDisplayName(e.target.value)} style={inputStyle} required
                />
              )}
              <input type="email" placeholder="Email" value={email}
                onChange={e => setEmail(e.target.value)} style={inputStyle} required />
              <input type="password" placeholder="Password" value={password}
                onChange={e => setPassword(e.target.value)} style={inputStyle} required />
              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '13px', borderRadius: 10, border: 'none', marginTop: 4,
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                color: 'var(--btn-text)', fontWeight: 700, fontFamily: 'Outfit, sans-serif', fontSize: '1rem',
                cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1,
              }}>
                {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'rgba(var(--text-rgb), 0.4)', marginTop: 20 }}>
              {mode === 'login' ? "Don't have an account? " : "Already have one? "}
              <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 600 }}>
                {mode === 'login' ? 'Register' : 'Sign In'}
              </button>
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
