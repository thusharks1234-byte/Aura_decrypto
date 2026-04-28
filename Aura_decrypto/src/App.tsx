import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { WalletProvider } from './contexts/WalletContext';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import CreateAuctionPage from './pages/CreateAuctionPage';
import AuctionDetailPage from './pages/AuctionDetailPage';
import CommitPage from './pages/CommitPage';
import RevealPage from './pages/RevealPage';
import ResultsPage from './pages/ResultsPage';
import ProfilePage from './pages/ProfilePage';
import DocsPage from './pages/DocsPage';

const NotFound: React.FC = () => (
  <div style={{ minHeight: '100vh', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, paddingTop: 64 }}>
    <span style={{ fontSize: '6rem', fontFamily: 'Outfit, sans-serif', fontWeight: 900, background: 'linear-gradient(135deg, #00ff88, #00ccff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>404</span>
    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1.1rem' }}>This page doesn't exist.</p>
    <a href="/dashboard" style={{ color: '#00ff88', textDecoration: 'none', fontWeight: 600 }}>← Back to Dashboard</a>
  </div>
);

const App: React.FC = () => (
  <AuthProvider>
    <WalletProvider>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/auction/create" element={<CreateAuctionPage />} />
        <Route path="/auction/:id" element={<AuctionDetailPage />} />
        <Route path="/auction/:id/commit" element={<CommitPage />} />
        <Route path="/auction/:id/reveal" element={<RevealPage />} />
        <Route path="/auction/:id/results" element={<ResultsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </WalletProvider>
  </AuthProvider>
);

export default App;
