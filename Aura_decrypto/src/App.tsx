import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { WalletProvider } from './contexts/WalletContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import CreateAuctionPage from './pages/CreateAuctionPage';
import AuctionDetailPage from './pages/AuctionDetailPage';

import ResultsPage from './pages/ResultsPage';
import ProfilePage from './pages/ProfilePage';
import DocsPage from './pages/DocsPage';

const NotFound: React.FC = () => (
  <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, paddingTop: 64 }}>
    <span style={{ fontSize: '6rem', fontFamily: 'Outfit, sans-serif', fontWeight: 900, background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>404</span>
    <p style={{ color: 'rgba(var(--text-rgb), 0.4)', fontSize: '1.1rem' }}>This page doesn't exist.</p>
    <a href="/dashboard" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>← Back to Dashboard</a>
  </div>
);

const App: React.FC = () => (
  <ThemeProvider>
    <AuthProvider>
      <WalletProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/auction/create" element={<CreateAuctionPage />} />
          <Route path="/auction/:id" element={<AuctionDetailPage />} />

          <Route path="/auction/:id/results" element={<ResultsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </WalletProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
