import { supabase } from './supabaseClient';

// ---- Types ----
export interface Auction {
  id: string;
  contract_address: string;
  creator_id: string | null;
  title: string;
  description: string | null;
  asset_image_url: string | null;
  asset_type: string | null;
  asset_contract: string | null;
  asset_token_id: string | null;
  auction_type: 'standard' | 'vickrey';
  reserve_price_wei: string;
  commit_start: string;
  commit_end: string;
  reveal_end: string;
  status: 'upcoming' | 'commit' | 'reveal' | 'active' | 'ended' | 'cancelled';
  winner_address: string | null;
  winning_bid_wei: string | null;
  price_paid_wei: string | null;
  tx_hash: string | null;
  chain_id: number;
  is_demo: boolean;
  created_at: string;
  profiles?: { display_name: string; wallet_address: string | null };
}

export interface Bid {
  id: string;
  auction_id: string;
  bidder_id: string;
  bidder_address: string;
  commit_hash: string;
  encrypted_secret: string | null;
  revealed_amount_wei: string | null;
  status: 'committed' | 'revealed' | 'invalid' | 'won' | 'lost' | 'refund_pending' | 'refunded' | 'placed';
  commit_tx_hash: string | null;
  reveal_tx_hash: string | null;
  deposit_wei: string;
  created_at: string;
  revealed_at: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  auction_id: string | null;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
}

// ---- Auctions ----
export const getAuctions = async (status?: string) => {
  let query = supabase
    .from('auctions')
    .select('*, profiles(display_name, wallet_address)')
    .order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  return { data: data as Auction[] | null, error };
};

export const getAuction = async (id: string) => {
  const { data, error } = await supabase
    .from('auctions')
    .select('*, profiles(display_name, wallet_address)')
    .eq('id', id)
    .single();
  return { data: data as Auction | null, error };
};

export const createAuction = async (auction: Omit<Auction, 'id' | 'created_at' | 'winner_address' | 'winning_bid_wei' | 'price_paid_wei' | 'profiles'>) => {
  const { data, error } = await supabase.from('auctions').insert(auction).select().single();
  return { data: data as Auction | null, error };
};

export const updateAuctionStatus = async (id: string, status: Auction['status'], extra?: Partial<Auction>) => {
  const { error } = await supabase.from('auctions').update({ status, ...extra }).eq('id', id);
  return { error };
};

// ---- Bids ----
export const getBidsForAuction = async (auctionId: string) => {
  const { data, error } = await supabase
    .from('bids')
    .select('*')
    .eq('auction_id', auctionId)
    .order('created_at', { ascending: false });
  return { data: data as Bid[] | null, error };
};

export const getMyBid = async (auctionId: string, userId: string) => {
  const { data, error } = await supabase
    .from('bids')
    .select('*')
    .eq('auction_id', auctionId)
    .eq('bidder_id', userId)
    .single();
  return { data: data as Bid | null, error };
};

export const submitBid = async (bid: Omit<Bid, 'id' | 'created_at' | 'revealed_at' | 'status' | 'revealed_amount_wei'>) => {
  const { data, error } = await supabase.from('bids').insert({ ...bid, status: 'committed' }).select().single();
  return { data: data as Bid | null, error };
};

export const placeBid = async (bid: Omit<Bid, 'id' | 'created_at' | 'revealed_at' | 'status' | 'commit_hash' | 'encrypted_secret' | 'revealed_amount_wei'>) => {
  const { data, error } = await supabase.from('bids').insert({ 
    ...bid, 
    status: 'placed',
    commit_hash: 'open_bid_' + bid.deposit_wei,
    encrypted_secret: null,
    revealed_amount_wei: bid.deposit_wei 
  }).select().single();
  return { data: data as Bid | null, error };
};

export const revealBid = async (bidId: string, revealedAmountWei: string, revealTxHash: string) => {
  const { error } = await supabase.from('bids').update({
    status: 'revealed',
    revealed_amount_wei: revealedAmountWei,
    reveal_tx_hash: revealTxHash,
    revealed_at: new Date().toISOString(),
  }).eq('id', bidId);
  return { error };
};

export const getMyBids = async (userId: string) => {
  const { data, error } = await supabase
    .from('bids')
    .select('*, auctions(title, status, commit_end, reveal_end)')
    .eq('bidder_id', userId)
    .order('created_at', { ascending: false });
  return { data, error };
};

// ---- Notifications ----
export const getNotifications = async (userId: string) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);
  return { data: data as Notification[] | null, error };
};

export const markNotificationRead = async (id: string) => {
  await supabase.from('notifications').update({ read: true }).eq('id', id);
};

export const markAllNotificationsRead = async (userId: string) => {
  await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
};

export const createNotification = async (n: Omit<Notification, 'id' | 'created_at' | 'read'>) => {
  await supabase.from('notifications').insert({ ...n, read: false });
};

// ---- Demo Balance ----
export const getDemoBalance = async (userId: string): Promise<number> => {
  const { data } = await supabase.from('profiles').select('demo_balance').eq('id', userId).single();
  return data?.demo_balance ?? 5.0;
};

export const deductDemoBalance = async (userId: string, ethAmount: number): Promise<{ success: boolean; newBalance: number }> => {
  const current = await getDemoBalance(userId);
  if (current < ethAmount) return { success: false, newBalance: current };
  const newBal = Math.round((current - ethAmount) * 10000) / 10000;
  await supabase.from('profiles').update({ demo_balance: newBal }).eq('id', userId);
  return { success: true, newBalance: newBal };
};

export const refundDemoBalance = async (userId: string, ethAmount: number): Promise<void> => {
  const current = await getDemoBalance(userId);
  const newBal = Math.round((current + ethAmount) * 10000) / 10000;
  await supabase.from('profiles').update({ demo_balance: newBal }).eq('id', userId);
};

// ---- Auto Status Transition ----
export const triggerStatusTransitions = async () => {
  await supabase.rpc('auto_transition_auction_statuses');
};

// ---- Platform Stats ----
export interface PlatformStats {
  liveAuctions: number;
  totalBidders: number;
  volumeLockedWei: string;
}

export const getPlatformStats = async (): Promise<{ data: PlatformStats | null; error: unknown }> => {
  try {
    // Count live auctions (commit or reveal phase)
    const { count: liveCount, error: liveErr } = await supabase
      .from('auctions')
      .select('*', { count: 'exact', head: true })
      .in('status', ['commit', 'reveal']);
    if (liveErr) throw liveErr;

    // Get unique bidder count and total volume
    const { data: bidData, error: bidErr } = await supabase
      .from('bids')
      .select('bidder_address, deposit_wei');
    if (bidErr) throw bidErr;

    const uniqueBidders = new Set((bidData || []).map(b => b.bidder_address)).size;
    const volumeWei = (bidData || []).reduce(
      (acc, b) => acc + BigInt(b.deposit_wei || '0'),
      BigInt(0)
    );

    return {
      data: {
        liveAuctions: liveCount || 0,
        totalBidders: uniqueBidders,
        volumeLockedWei: volumeWei.toString(),
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error };
  }
};

// ---- Auction Events ----
export const getAuctionEvents = async (auctionId: string) => {
  const { data, error } = await supabase
    .from('auction_events')
    .select('*')
    .eq('auction_id', auctionId)
    .order('created_at', { ascending: false })
    .limit(50);
  return { data, error };
};

export const logAuctionEvent = async (event: {
  auction_id: string;
  event_type: string;
  actor_address?: string;
  data?: Record<string, unknown>;
  tx_hash?: string;
}) => {
  await supabase.from('auction_events').insert(event);
};
