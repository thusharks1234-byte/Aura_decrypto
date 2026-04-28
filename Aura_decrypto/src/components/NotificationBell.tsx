import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, CheckCheck, Gavel, Trophy, Eye, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getNotifications, markNotificationRead, markAllNotificationsRead, type Notification } from '../lib/supabase';
import { supabase } from '../lib/supabaseClient';

const iconMap: Record<string, React.ReactNode> = {
  new_bid: <Bell size={14} color="#00ccff" />,
  bid_confirmed: <Check size={14} color="#00ff88" />,
  bid_revealed: <Eye size={14} color="#ffcc00" />,
  auction_created: <Gavel size={14} color="#00ff88" />,
  auction_won: <Trophy size={14} color="#ffcc00" />,
  auction_lost: <AlertCircle size={14} color="#ff8800" />,
};

const timeAgo = (date: string): string => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!user) return;
    loadNotifications();

    // Real-time subscription for new notifications
    const channel = supabase
      .channel('user_notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setNotifications(prev => [payload.new as Notification, ...prev]);
      })
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const loadNotifications = async () => {
    if (!user) return;
    const { data } = await getNotifications(user.id);
    setNotifications(data || []);
  };

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    await markAllNotificationsRead(user.id);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  if (!user) return null;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative', background: 'none', border: 'none',
          color: isOpen ? '#00ff88' : 'rgba(255,255,255,0.6)',
          cursor: 'pointer', padding: 8, transition: 'color 0.2s',
        }}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 4, right: 4,
            minWidth: 16, height: 16, borderRadius: 100,
            background: '#ff4d4d', border: '2px solid #050505',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.6rem', fontWeight: 700, color: '#fff',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: -40,
              width: 340, maxHeight: 440, overflowY: 'auto',
              background: '#111', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 16, zIndex: 200,
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)',
              position: 'sticky', top: 0, background: '#111', zIndex: 1,
            }}>
              <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '0.95rem' }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  style={{
                    background: 'none', border: 'none', color: '#00ff88',
                    fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  <CheckCheck size={14} /> Mark all read
                </button>
              )}
            </div>

            {/* List */}
            {notifications.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.875rem' }}>
                No notifications yet
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => handleMarkRead(n.id)}
                  style={{
                    display: 'flex', gap: 12, padding: '14px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    background: n.read ? 'transparent' : 'rgba(0,255,136,0.03)',
                    cursor: 'pointer', transition: 'background 0.2s',
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                    background: 'rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {iconMap[n.type] || <Bell size={14} color="rgba(255,255,255,0.4)" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: '0.82rem', color: n.read ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.85)',
                      lineHeight: 1.5, margin: '0 0 4px',
                    }}>
                      {n.message}
                    </p>
                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)' }}>
                      {timeAgo(n.created_at)}
                    </span>
                  </div>
                  {!n.read && (
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%', background: '#00ff88',
                      flexShrink: 0, marginTop: 4,
                    }} />
                  )}
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
