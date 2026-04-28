import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Filter, TrendingUp, Gavel, Clock, Award } from 'lucide-react';
import { getAuctions, type Auction } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import AuctionCard from '../components/AuctionCard';
import AuthModal from '../components/AuthModal';

const FILTERS = ['All', 'Commit', 'Reveal', 'Ended', 'Upcoming'];

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    fetchAuctions();
  }, [filter]);

  const fetchAuctions = async () => {
    setIsLoading(true);
    const statusMap: Record<string, string | undefined> = { All: undefined, Commit: 'commit', Reveal: 'reveal', Ended: 'ended', Upcoming: 'upcoming' };
    const { data } = await getAuctions(statusMap[filter]);
    setAuctions(data || []);
    setIsLoading(false);
  };

  const stats = [
    { icon: Gavel, label: 'Live Auctions', value: auctions.filter(a => a.status === 'commit' || a.status === 'reveal').length },
    { icon: Clock, label: 'Reveal Phase', value: auctions.filter(a => a.status === 'reveal').length },
    { icon: Award, label: 'Completed', value: auctions.filter(a => a.status === 'ended').length },
    { icon: TrendingUp, label: 'Total Listed', value: auctions.length },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#050505', paddingTop: 64 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 36 }}>
          <div>
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 800, marginBottom: 6 }}>
              Auction Dashboard
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.95rem' }}>Sealed-bid auctions — privacy-first, front-run proof</p>
          </div>
          <Link to="/auction/create" style={{ textDecoration: 'none' }}>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              style={{
                background: 'linear-gradient(135deg, #00ff88, #00ccff)',
                border: 'none', borderRadius: 10, padding: '11px 22px',
                fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '0.9rem',
                color: '#000', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              }}>
              <Plus size={16} /> Create Auction
            </motion.button>
          </Link>
        </div>

        {/* Quick Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 36 }}>
          {stats.map((s, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <s.icon size={16} color="#00ff88" />
                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)' }}>{s.label}</span>
              </div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2rem', fontWeight: 800 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '8px 18px', borderRadius: 100, border: '1px solid',
              borderColor: filter === f ? '#00ff88' : 'rgba(255,255,255,0.1)',
              background: filter === f ? 'rgba(0,255,136,0.1)' : 'transparent',
              color: filter === f ? '#00ff88' : 'rgba(255,255,255,0.6)',
              fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
            }}>{f}</button>
          ))}
        </div>

        {/* Auction Grid */}
        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
            {[1, 2, 3].map(n => (
              <div key={n} style={{ height: 440, background: 'rgba(255,255,255,0.03)', borderRadius: 20, animation: 'shimmer 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        ) : auctions.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ textAlign: 'center', padding: '80px 24px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 20 }}>
            <Gavel size={48} color="rgba(255,255,255,0.1)" style={{ marginBottom: 16 }} />
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.3rem', marginBottom: 8 }}>No auctions found</h3>
            <p style={{ color: 'rgba(255,255,255,0.3)', marginBottom: 24 }}>
              {filter !== 'All' ? `No ${filter.toLowerCase()} auctions at the moment.` : 'Be the first to create a sealed-bid auction!'}
            </p>
            <Link to="/auction/create" style={{ textDecoration: 'none' }}>
              <button style={{
                background: 'linear-gradient(135deg, #00ff88, #00ccff)',
                border: 'none', borderRadius: 10, padding: '12px 28px',
                fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: '#000', cursor: 'pointer',
              }}>Create First Auction</button>
            </Link>
          </motion.div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
            {auctions.map((auction, i) => (
              <motion.div key={auction.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <AuctionCard auction={auction} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      <style>{`@keyframes shimmer { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }`}</style>
    </div>
  );
};

export default DashboardPage;
