# 📄 Product Requirements Document (PRD)
## SealBid — Sealed-Bid Auction Platform (Web3 / ZK Privacy)
**Version:** 1.0.0  
**Date:** April 28, 2026  
**Category:** Privacy / ZK · Web3 Hackathon — PS 7  
**Stack:** React + Vite + TypeScript · Supabase · Ethers.js / Wagmi · TailwindCSS · Framer Motion  
**Framework Convention:** Antigravity Design System  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement & Context](#2-problem-statement--context)
3. [Goals & Success Metrics](#3-goals--success-metrics)
4. [Scope](#4-scope)
5. [User Personas](#5-user-personas)
6. [User Stories & Acceptance Criteria](#6-user-stories--acceptance-criteria)
7. [System Architecture](#7-system-architecture)
8. [Authentication & User Management](#8-authentication--user-management)
9. [Frontend — Pages & Components](#9-frontend--pages--components)
10. [Smart Contract Layer](#10-smart-contract-layer)
11. [Backend — Supabase Schema & Logic](#11-backend--supabase-schema--logic)
12. [Auction Lifecycle & State Machine](#12-auction-lifecycle--state-machine)
13. [Commit-Reveal Protocol](#13-commit-reveal-protocol)
14. [Refund & Payment Logic](#14-refund--payment-logic)
15. [Vickrey (Second-Price) Variant](#15-vickrey-second-price-variant)
16. [Security Requirements](#16-security-requirements)
17. [UI/UX Design System (Antigravity)](#17-uiux-design-system-antigravity)
18. [Animations & Motion Design](#18-animations--motion-design)
19. [Notifications & Real-Time Updates](#19-notifications--real-time-updates)
20. [API Contracts](#20-api-contracts)
21. [Environment & Configuration](#21-environment--configuration)
22. [Testing Strategy](#22-testing-strategy)
23. [Deployment & DevOps](#23-deployment--devops)
24. [Bonus Features Roadmap](#24-bonus-features-roadmap)
25. [Risks & Mitigations](#25-risks--mitigations)
26. [Glossary](#26-glossary)

---

## 1. Executive Summary

**SealBid** is a full-stack Web3 application implementing sealed-bid auctions on-chain using a commit-reveal scheme to prevent front-running. Bidders commit a hash of their bid amount + secret during the **Commit Phase**, then reveal it in the **Reveal Phase**. The smart contract determines the winner and handles trustless refunds. Supabase stores off-chain metadata (user profiles, auction details, notification logs), while the blockchain handles all trustless financial logic.

The UI is built with a premium **Antigravity** aesthetic — dark, high-contrast, typographically bold, with fluid animations — evoking the precision and tension of high-stakes auction environments.

---

## 2. Problem Statement & Context

### 2.1 The Core Problem
Open on-chain auctions are trivially front-runnable:
- Every bid is visible in the mempool before it is mined.
- MEV bots monitor pending transactions and outbid by 1 wei.
- Result: genuine bidders are systematically disadvantaged; auctions lose fairness.

### 2.2 The Solution: Commit-Reveal
A two-phase sealed-bid mechanism:
1. **Commit Phase** — Bidder submits `keccak256(amount || secret || bidderAddress)` + a deposit. Bid amount is hidden.
2. **Reveal Phase** — Bidder reveals `amount` and `secret`. Contract verifies the hash matches, determines winner.

### 2.3 Vickrey Variant
- Winner pays the **second-highest** price, not their own bid.
- Dominant strategy: bidding true value is always optimal.
- Eliminates bid shading and strategic underbidding.

### 2.4 Real-World Parallels
| Domain | Usage |
|---|---|
| ENS (Ethereum Name Service) | Used sealed-bid auctions for domain names for years |
| NFT Drops | Art Blocks, Nouns variants experiment with sealed bids |
| Government | Spectrum auctions, Treasury bond sales |
| Real Estate & Art | Blind sealed bids are standard in competitive markets |

---

## 3. Goals & Success Metrics

### 3.1 Primary Goals
| # | Goal |
|---|---|
| G1 | Implement a fully functional sealed-bid auction dApp with commit-reveal |
| G2 | Zero reentrancy vulnerabilities in refund/withdrawal flows |
| G3 | Premium, production-grade UI that communicates trust and sophistication |
| G4 | Supabase-backed user profiles, auction metadata, and notification logs |
| G5 | Support Vickrey (second-price) variant as a toggle |

### 3.2 Success Metrics
| Metric | Target |
|---|---|
| Smart contract audit score | 0 critical / 0 high vulnerabilities |
| Refund accuracy | 100% of losing bids refundable |
| Page load (LCP) | < 2.5s on mid-tier device |
| Auction creation → commit flow | ≤ 3 user interactions |
| Test coverage (contracts) | ≥ 90% branch coverage |
| Supabase query latency | < 200ms p95 |

---

## 4. Scope

### 4.1 In Scope (MVP)
- User authentication (email/wallet) with Supabase
- Auction creation with configurable phases
- Commit phase: hashed bid + deposit submission
- Reveal phase: plaintext reveal + hash verification on-chain
- Winner determination + refund logic
- Auction dashboard (live, upcoming, ended)
- User portfolio (auctions created, bids placed, wins)
- Vickrey (second-price) mode toggle
- Responsive, animated UI with Antigravity design

### 4.2 Out of Scope (MVP)
- ZK proofs (post-MVP enhancement)
- Cross-chain support
- Mobile native app
- DAO governance of auction parameters

---

## 5. User Personas

### 5.1 Alex — The DeFi Power User
- **Background:** Experienced Ethereum user, familiar with wallets and gas
- **Goal:** Participate in fair, bot-resistant auctions
- **Pain Point:** Lost NFT drops to MEV bots repeatedly
- **Usage:** Browses active auctions, commits sealed bids, monitors reveal phase

### 5.2 Maya — The Auction Creator
- **Background:** NFT artist, small project founder
- **Goal:** Run a fair auction for her NFT drop without favoring bots
- **Pain Point:** Can't configure meaningful auction mechanics on existing platforms
- **Usage:** Creates auctions, sets commit/reveal windows, monitors activity

### 5.3 Carlos — The Curious Developer
- **Background:** Solidity learner, hackathon participant
- **Goal:** Study how commit-reveal works in production
- **Usage:** Reads docs, explores contract interactions, tests on testnet

### 5.4 Priya — The Compliance-Conscious Bidder
- **Background:** Traditional finance professional exploring Web3
- **Goal:** Participate in a structured, verifiable auction
- **Pain Point:** Lacks trust in opaque on-chain systems
- **Usage:** Views auction history, winner verification proofs, audit trail

---

## 6. User Stories & Acceptance Criteria

### 6.1 Authentication

**US-01: Sign Up with Email**
- *As a new user*, I want to register with email + password so that my profile is saved.
- **AC:** Email verified via Supabase; user row created in `profiles` table; JWT issued.

**US-02: Connect Wallet**
- *As a user*, I want to connect my MetaMask/WalletConnect wallet so that I can interact with auctions.
- **AC:** Wallet address stored in `profiles.wallet_address`; signs a nonce for verification; session persists.

**US-03: Sign In**
- *As a returning user*, I want to sign in so that I see my history.
- **AC:** Supabase auth returns session; wallet connection auto-prompted.

### 6.2 Auction Creation

**US-04: Create Auction**
- *As an auction creator*, I want to configure and deploy an auction so that bidders can participate.
- **AC:** Creator fills: title, description, asset info, commit duration, reveal duration, reserve price, auction type (standard/Vickrey). Contract deployed; record inserted into `auctions` table.

**US-05: Multiple Concurrent Auctions**
- *As a creator*, I want to run multiple auctions simultaneously.
- **AC:** Each auction has an independent contract instance; dashboard shows all.

### 6.3 Bidding

**US-06: Commit a Bid**
- *As a bidder*, I want to commit a sealed bid with a deposit so that my amount stays hidden.
- **AC:** App generates `keccak256(amount || secret || address)` locally; user signs tx with deposit ≥ bid amount; commitment stored on-chain + bid record in `bids` table (hash only, no amount).

**US-07: Secret Management**
- *As a bidder*, I want my secret to be saved locally (or via Supabase) so I don't lose it.
- **AC:** Secret encrypted and stored in `bids.encrypted_secret` (user-key encrypted); downloadable as JSON backup.

**US-08: Reveal a Bid**
- *As a bidder*, I want to reveal my bid during the reveal phase.
- **AC:** App auto-fills amount + secret from storage; user confirms tx; contract verifies hash; status updated in `bids.status`.

**US-09: Refund for Losers**
- *As a losing bidder*, I want my deposit refunded after reveal phase.
- **AC:** Refund available via pull-payment; UI shows claimable amount; one-click claim tx.

### 6.4 Results

**US-10: View Auction Result**
- *As any user*, I want to see who won and at what price.
- **AC:** Winner address, winning bid, (Vickrey: payment price) displayed post-reveal; verifiable on-chain.

**US-11: Vickrey Price Display**
- *As a winner in Vickrey mode*, I want to see that I pay the second-highest price.
- **AC:** UI clearly shows `Your bid: X ETH | You pay: Y ETH (2nd price)`.

---

## 7. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
│  React + Vite + TypeScript  │  Tailwind + Framer Motion         │
│  Wagmi + Ethers.js          │  Supabase JS Client               │
└────────────┬───────────────────────────────┬────────────────────┘
             │                               │
             ▼                               ▼
┌─────────────────────┐          ┌───────────────────────┐
│   Ethereum Network  │          │     Supabase Backend  │
│   (Sepolia Testnet) │          │                       │
│                     │          │  Auth (email/wallet)  │
│  SealBidFactory.sol │          │  PostgreSQL DB         │
│  SealBidAuction.sol │          │  Row Level Security   │
│  (per auction)      │          │  Realtime Subscriptions│
│                     │          │  Storage (assets)     │
└─────────────────────┘          └───────────────────────┘
```

### 7.1 Technology Stack Summary

| Layer | Technology |
|---|---|
| Frontend Framework | React 18 + Vite + TypeScript |
| Styling | TailwindCSS + custom Antigravity design tokens |
| Animations | Framer Motion |
| Web3 / Wallet | Wagmi v2 + Viem + WalletConnect v2 |
| Smart Contracts | Solidity ^0.8.24 + Hardhat |
| Backend / Auth | Supabase (PostgreSQL + Auth + Realtime + Storage) |
| State Management | Zustand + React Query (TanStack) |
| Form Handling | React Hook Form + Zod |
| Routing | React Router v6 |
| Notifications | Sonner (toast) + Supabase Realtime |
| Testing (contracts) | Hardhat + Chai + Ethers |
| Testing (frontend) | Vitest + Testing Library |
| Deployment | Vercel (frontend) + Supabase Cloud + Sepolia |

---

## 8. Authentication & User Management

### 8.1 Auth Flow

```
User visits app
      │
      ├─► Email + Password  ──► Supabase Auth ──► JWT + Session
      │
      └─► "Connect Wallet"  ──► Sign nonce ──► Verify signature
                                             ──► Store wallet_address in profiles
```

### 8.2 Login Page Specification

**Route:** `/login`  
**Components:**
- Animated logo / wordmark entrance
- Tab switcher: `Sign In` | `Sign Up`
- Email + Password fields (React Hook Form + Zod validation)
- "Connect Wallet" button (Wagmi `useConnect`)
- OAuth: Google (via Supabase OAuth)
- Error states with inline feedback
- Loading shimmer on submit

**Sign Up Fields:**
| Field | Validation |
|---|---|
| Display Name | 2–32 chars, alphanumeric + underscore |
| Email | Valid email format |
| Password | Min 8 chars, 1 uppercase, 1 number |
| Confirm Password | Must match |

**Post-Auth Redirect:** `/dashboard`

### 8.3 Supabase Auth Config
- Email confirmation: enabled
- JWT expiry: 3600s (1 hour), refresh token: 7 days
- Row Level Security: enabled on all tables
- Wallet nonce verification: Edge Function `verify-wallet-signature`

---

## 9. Frontend — Pages & Components

### 9.1 Route Map

| Route | Page | Auth Required |
|---|---|---|
| `/` | Landing / Hero | No |
| `/login` | Login & Sign Up | No |
| `/dashboard` | Auction Dashboard | Yes |
| `/auction/create` | Create Auction | Yes |
| `/auction/:id` | Auction Detail | No (view), Yes (bid) |
| `/auction/:id/commit` | Commit Bid | Yes |
| `/auction/:id/reveal` | Reveal Bid | Yes |
| `/auction/:id/results` | Results & Refunds | No |
| `/profile` | User Profile & History | Yes |
| `/profile/:address` | Public Profile | No |
| `/docs` | How It Works | No |
| `*` | 404 | No |

---

### 9.2 Landing Page (`/`)

**Sections:**
1. **Hero** — Full-viewport animated header with:
   - Tagline: *"Bid sealed. Win fair."*
   - Particle / noise background
   - CTA: `Launch App` → `/dashboard`
   - Animated SVG auction hammer or cryptographic hash visualization

2. **How It Works** — 3-step animated timeline:
   - Step 1: Commit (lock + hash icon)
   - Step 2: Reveal (unlock icon)
   - Step 3: Winner pays, losers get refunded

3. **Why Sealed Bids** — Split comparison panel: Open Auction (bot chaos) vs Sealed Bid (fair)

4. **Live Stats** — Real-time counter: auctions active, ETH locked, bids committed

5. **Footer** — Links, docs, GitHub, social

---

### 9.3 Dashboard (`/dashboard`)

**Layout:** 3-column grid (sidebar + main feed + activity panel)

**Sub-sections:**
- **Filter Bar:** All | Committing | Revealing | Ended | My Auctions
- **Auction Cards:** Each shows:
  - Asset thumbnail
  - Auction title + creator
  - Phase badge (Commit / Reveal / Ended) with countdown timer
  - Auction type badge (Standard / Vickrey)
  - # of committed bids (not amounts)
  - Reserve price
  - CTA button (context-aware: Commit Now / Reveal Now / View Results)
- **Sidebar:** Quick stats (my active bids, claimable refunds)
- **Activity Feed:** Real-time on-chain events (new commitments, reveals, winner set)

---

### 9.4 Create Auction Page (`/auction/create`)

**Form Sections:**

**Section A — Asset Details**
- Auction title
- Asset description (rich text)
- Asset image upload (Supabase Storage)
- Asset type (NFT, Token, Physical, Other)
- Contract address (if NFT) + Token ID

**Section B — Auction Configuration**
- Auction type: Standard | Vickrey (toggle with explanation tooltip)
- Reserve price (ETH)
- Commit phase duration (hours/days picker)
- Reveal phase duration (hours/days picker)
- Max number of bidders (optional cap)

**Section C — Advanced**
- Whitelist addresses (optional)
- Self-destruct on no valid reveals (checkbox)

**Deploy Flow:**
1. Form validation (Zod)
2. Preview panel shows summary
3. "Deploy Auction" button → triggers wallet tx (factory contract `createAuction()`)
4. Tx pending animation
5. On confirmation: redirect to `/auction/:id`

---

### 9.5 Auction Detail Page (`/auction/:id`)

**Header:**
- Asset image (large)
- Title, creator, deployed contract address (with Etherscan link)
- Phase indicator with live countdown (Framer Motion animated ring)
- Auction type badge

**Phase-Specific Panel:**

| Phase | Panel Content |
|---|---|
| **Commit** | "Place Sealed Bid" form (amount + secret), generate hash preview, submit tx |
| **Reveal** | "Reveal Your Bid" — auto-fill from storage, confirm reveal tx |
| **Ended** | Winner banner, winning bid, (Vickrey: payment price), all revealed bids ranked |

**Bid History Table:**
- Columns: Bidder Address, Status (committed/revealed/invalid), Bid Amount (hidden until reveal), Reveal Status
- Blurred amounts during commit phase → revealed post-reveal

**Activity Log:**
- Timestamped log of on-chain events for this auction

---

### 9.6 Commit Bid Flow (`/auction/:id/commit`)

**Step 1 — Enter Bid**
- Amount input (ETH) + deposit requirement shown
- Secret input (auto-generated by default; editable)
- "Copy Secret" + "Download Backup JSON" buttons

**Step 2 — Preview Commitment**
- Shows generated hash: `keccak256(amount || secret || yourAddress)`
- Warning: *"Once committed, your bid is sealed. Save your secret — you cannot reveal without it."*

**Step 3 — Confirm & Submit**
- Wallet prompt for tx with deposit value
- Pending + confirmed states

---

### 9.7 Reveal Bid Flow (`/auction/:id/reveal`)

**Step 1 — Load Secret**
- Auto-load from Supabase encrypted storage
- Or: manual entry / JSON file upload

**Step 2 — Preview**
- Shows: `amount`, `secret`, `computed hash` → `stored hash` (match/no-match indicator)

**Step 3 — Submit**
- Wallet tx for `reveal(amount, secret)`
- Confirmation animation

---

### 9.8 Results Page (`/auction/:id/results`)

**Sections:**
- 🏆 Winner banner (address, bid, amount paid)
- 📊 All revealed bids leaderboard (ranked, with amounts)
- 💸 Refund claim panel (for losers — pull-payment)
- 🔍 Verification panel (recompute hash, verify on-chain)
- 📋 Full event log

---

### 9.9 Profile Page (`/profile`)

**Tabs:**
- **My Auctions** — Auctions I created
- **My Bids** — All bids (committed, revealed, won, lost, pending refund)
- **Claimable Refunds** — Aggregated refund panel across all auctions
- **Settings** — Display name, avatar, linked wallet, email

---

### 9.10 How It Works (`/docs`)

**Content:**
- Interactive commit-reveal explainer (step-by-step animated diagram)
- Vickrey game theory explanation with interactive sliders
- Smart contract architecture diagram
- FAQ accordion
- Security guarantees section

---

## 10. Smart Contract Layer

### 10.1 Contracts Overview

```
SealBidFactory.sol
└── createAuction(...) → deploys SealBidAuction
└── getAllAuctions() → address[]

SealBidAuction.sol
├── commit(bytes32 commitHash) payable
├── reveal(uint256 amount, bytes32 secret)
├── finalizeAuction()
├── claimRefund()
├── getWinner() → (address, uint256)
└── State: COMMIT | REVEAL | ENDED
```

### 10.2 SealBidAuction.sol — Key Functions

```solidity
// Commit phase
function commit(bytes32 commitHash) external payable {
    require(phase == Phase.COMMIT, "Not in commit phase");
    require(msg.value >= minDeposit, "Insufficient deposit");
    require(commitments[msg.sender].hash == bytes32(0), "Already committed");
    commitments[msg.sender] = Commitment({
        hash: commitHash,
        deposit: msg.value,
        revealed: false,
        validBid: 0
    });
    emit BidCommitted(msg.sender, commitHash);
}

// Reveal phase
function reveal(uint256 amount, bytes32 secret) external {
    require(phase == Phase.REVEAL, "Not in reveal phase");
    Commitment storage c = commitments[msg.sender];
    require(c.hash != bytes32(0), "No commitment found");
    require(!c.revealed, "Already revealed");
    bytes32 expectedHash = keccak256(abi.encodePacked(amount, secret, msg.sender));
    require(expectedHash == c.hash, "Hash mismatch");
    require(amount <= c.deposit, "Bid exceeds deposit");
    c.revealed = true;
    c.validBid = amount;
    emit BidRevealed(msg.sender, amount);
    _updateLeaderboard(msg.sender, amount);
}

// Checks-Effects-Interactions for refund (reentrancy-safe)
function claimRefund() external nonReentrant {
    uint256 refundAmount = pendingRefunds[msg.sender];
    require(refundAmount > 0, "No refund available");
    pendingRefunds[msg.sender] = 0;  // Effects before Interaction
    (bool success, ) = payable(msg.sender).call{value: refundAmount}("");
    require(success, "Refund transfer failed");
    emit RefundClaimed(msg.sender, refundAmount);
}
```

### 10.3 Security Patterns
- `ReentrancyGuard` (OpenZeppelin) on all ETH-sending functions
- **Pull-payment pattern** for refunds (no push to multiple addresses in a loop)
- **Checks-Effects-Interactions** enforced
- Phase state machine — all actions gated by current phase
- Reveal hash verification: `keccak256(abi.encodePacked(amount, secret, bidderAddress))`
- Owner-only `finalizeAuction()` or time-based auto-transition

### 10.4 Events
```solidity
event AuctionCreated(address indexed auctionAddress, address indexed creator);
event BidCommitted(address indexed bidder, bytes32 commitHash);
event BidRevealed(address indexed bidder, uint256 amount);
event AuctionFinalized(address indexed winner, uint256 winningBid, uint256 pricePaid);
event RefundClaimed(address indexed bidder, uint256 amount);
event PhaseTransitioned(Phase from, Phase to);
```

---

## 11. Backend — Supabase Schema & Logic

### 11.1 Tables

#### `profiles`
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name TEXT NOT NULL,
  wallet_address TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `auctions`
```sql
CREATE TABLE auctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_address TEXT UNIQUE NOT NULL,
  creator_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  asset_image_url TEXT,
  asset_type TEXT,
  asset_contract TEXT,
  asset_token_id TEXT,
  auction_type TEXT CHECK (auction_type IN ('standard', 'vickrey')) DEFAULT 'standard',
  reserve_price_wei TEXT NOT NULL,
  commit_start TIMESTAMPTZ NOT NULL,
  commit_end TIMESTAMPTZ NOT NULL,
  reveal_end TIMESTAMPTZ NOT NULL,
  status TEXT CHECK (status IN ('upcoming', 'commit', 'reveal', 'ended', 'cancelled')) DEFAULT 'upcoming',
  winner_address TEXT,
  winning_bid_wei TEXT,
  price_paid_wei TEXT,
  tx_hash TEXT,
  chain_id INTEGER DEFAULT 11155111,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `bids`
```sql
CREATE TABLE bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID REFERENCES auctions(id),
  bidder_id UUID REFERENCES profiles(id),
  bidder_address TEXT NOT NULL,
  commit_hash TEXT NOT NULL,
  encrypted_secret TEXT,
  revealed_amount_wei TEXT,
  status TEXT CHECK (status IN ('committed', 'revealed', 'invalid', 'won', 'lost', 'refund_pending', 'refunded')) DEFAULT 'committed',
  commit_tx_hash TEXT,
  reveal_tx_hash TEXT,
  deposit_wei TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revealed_at TIMESTAMPTZ
);
```

#### `notifications`
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  auction_id UUID REFERENCES auctions(id),
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `auction_events`
```sql
CREATE TABLE auction_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID REFERENCES auctions(id),
  event_type TEXT NOT NULL,
  actor_address TEXT,
  data JSONB,
  tx_hash TEXT,
  block_number BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 11.2 Row Level Security (RLS)

```sql
-- Profiles: users see/edit only their own
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own profile" ON profiles
  USING (auth.uid() = id);

-- Bids: bidder sees their own bids only
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own bids" ON bids
  USING (auth.uid() = bidder_id);

-- Auctions: public read, creator write
ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read auctions" ON auctions FOR SELECT USING (true);
CREATE POLICY "Creator insert" ON auctions FOR INSERT
  WITH CHECK (auth.uid() = creator_id);
```

### 11.3 Supabase Edge Functions

| Function | Trigger | Purpose |
|---|---|---|
| `verify-wallet-signature` | HTTP POST | Verify EIP-191 signed nonce; link wallet to profile |
| `sync-auction-status` | Cron (every 1 min) | Check phase transitions by timestamp, update `auctions.status` |
| `process-refunds` | DB trigger on `bids.status` update | Compute refund amounts post-finalization |
| `send-notification` | DB trigger on `auction_events` | Insert notification row for relevant users |

### 11.4 Realtime Subscriptions (Frontend)
```typescript
// Subscribe to auction status changes
supabase
  .channel('auction-updates')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'auctions',
    filter: `id=eq.${auctionId}`
  }, handleAuctionUpdate)
  .subscribe();

// Subscribe to new bid events
supabase
  .channel('bid-events')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'auction_events',
    filter: `auction_id=eq.${auctionId}`
  }, handleNewEvent)
  .subscribe();
```

---

## 12. Auction Lifecycle & State Machine

```
         ┌─────────────┐
         │   UPCOMING  │  (before commit_start)
         └──────┬──────┘
                │  commit_start reached
                ▼
         ┌─────────────┐
         │    COMMIT   │  Bidders submit hashed bids + deposits
         └──────┬──────┘
                │  commit_end reached
                ▼
         ┌─────────────┐
         │    REVEAL   │  Bidders reveal amount + secret
         └──────┬──────┘
                │  reveal_end reached + finalizeAuction() called
                ▼
         ┌─────────────┐
         │    ENDED    │  Winner set, refunds available
         └─────────────┘
```

### Phase Transition Rules
- `UPCOMING → COMMIT`: automatic at `commit_start` (cron + contract timestamp check)
- `COMMIT → REVEAL`: automatic at `commit_end`
- `REVEAL → ENDED`: triggered by `finalizeAuction()` (callable by anyone after `reveal_end`)
- Early cancel: creator can cancel during COMMIT if 0 bids received

---

## 13. Commit-Reveal Protocol

### 13.1 Hash Generation (Frontend)
```typescript
import { keccak256, encodePacked, parseEther } from 'viem';

export function generateCommitHash(
  amountEth: string,
  secret: string,
  bidderAddress: `0x${string}`
): `0x${string}` {
  const amountWei = parseEther(amountEth);
  const secretBytes = keccak256(new TextEncoder().encode(secret));
  return keccak256(encodePacked(
    ['uint256', 'bytes32', 'address'],
    [amountWei, secretBytes, bidderAddress]
  ));
}
```

### 13.2 Secret Storage Strategy
- **Primary:** Encrypted with user's wallet signature as key, stored in `bids.encrypted_secret` in Supabase
- **Secondary:** Downloadable JSON backup file offered at commit time
- **Local fallback:** `localStorage` with encryption (cleared on logout)
- **Warning flow:** If secret not found at reveal time → file upload recovery option

### 13.3 Reveal Validation
```typescript
// Frontend pre-validation before sending tx
export function validateReveal(
  amount: bigint,
  secret: string,
  address: `0x${string}`,
  storedHash: `0x${string}`
): boolean {
  const computed = generateCommitHash(amount, secret, address);
  return computed === storedHash;
}
```

---

## 14. Refund & Payment Logic

### 14.1 Standard Auction Refunds
- Winner pays their full bid amount
- Losers receive full deposit back via `claimRefund()`
- Invalid reveals (hash mismatch) forfeit a penalty (configurable, e.g. 5% of deposit) → remainder refundable

### 14.2 Vickrey Auction Payments
- Winner pays second-highest valid bid
- Winner's deposit excess (`winner_deposit - second_price`) → refundable
- All losers → full deposit refundable

### 14.3 Pull-Payment Implementation
```solidity
mapping(address => uint256) public pendingRefunds;

function _scheduleRefund(address bidder, uint256 amount) internal {
    pendingRefunds[bidder] += amount;
}

function claimRefund() external nonReentrant {
    uint256 amount = pendingRefunds[msg.sender];
    require(amount > 0);
    pendingRefunds[msg.sender] = 0;  // EFFECT before INTERACTION
    (bool ok,) = payable(msg.sender).call{value: amount}("");
    require(ok, "Transfer failed");
    emit RefundClaimed(msg.sender, amount);
}
```

### 14.4 Batch Refund (Bonus)
```solidity
function batchScheduleRefunds(address[] calldata losers) external onlyOwner {
    require(phase == Phase.ENDED);
    for (uint i = 0; i < losers.length; i++) {
        Commitment storage c = commitments[losers[i]];
        if (!c.revealed || losers[i] != winner) {
            _scheduleRefund(losers[i], c.deposit);
        }
    }
}
```

---

## 15. Vickrey (Second-Price) Variant

### 15.1 Logic
```solidity
function finalizeVickrey() internal {
    require(revealedBids.length >= 1);
    // Sort revealed bids descending
    address winner = highestBidder;
    uint256 winnerBid = highestBid;
    uint256 secondPrice = (revealedBids.length >= 2) ? secondHighestBid : reservePrice;
    
    pricePaid[winner] = secondPrice;
    _scheduleRefund(winner, winnerBid - secondPrice);
    
    for (uint i = 0; i < revealedBids.length; i++) {
        if (revealedBids[i].bidder != winner) {
            _scheduleRefund(revealedBids[i].bidder, commitments[revealedBids[i].bidder].deposit);
        }
    }
    emit AuctionFinalized(winner, winnerBid, secondPrice);
}
```

### 15.2 UI Representation
- Badge: `VICKREY` on auction cards
- Commit flow: tooltip explains *"You will pay the second-highest bid, not your own"*
- Results page: `You bid: 2.5 ETH | You pay: 1.8 ETH (2nd price saved you 0.7 ETH)`

---

## 16. Security Requirements

### 16.1 Smart Contract Security

| Threat | Mitigation |
|---|---|
| Reentrancy on refund | `ReentrancyGuard` + pull-payment + CEI pattern |
| Front-running bids | Commit-reveal hides bid until reveal phase |
| Griefing (never reveal) | Deposit penalty for non-revealers; auction can finalize without all reveals |
| Hash collision | `keccak256(amount, secret, address)` — address binding prevents replay across auctions |
| Timestamp manipulation | Phase transitions use block timestamps with ±15s tolerance |
| Integer overflow | Solidity ^0.8 built-in overflow protection |
| Short-address attack | `encodePacked` used carefully; `abi.encode` preferred for public inputs |

### 16.2 Frontend Security

| Threat | Mitigation |
|---|---|
| Secret exposure | Secret never sent to server unencrypted; encrypted with wallet sig key |
| XSS | React DOM escaping + strict CSP headers |
| CSRF | Supabase JWT in Authorization header (not cookie) |
| Wallet phishing | Clear tx descriptions; never request `eth_sign` of arbitrary data |
| Fake auction contracts | Display Etherscan verification badge; factory contract registry |

### 16.3 Backend (Supabase) Security

- RLS enabled on all tables
- Wallet signature verification via Edge Function before linking wallet
- No private keys or secrets stored server-side
- Supabase service role key never exposed to client

---

## 17. UI/UX Design System (Antigravity)

### 17.1 Aesthetic Direction
**Theme:** *Dark Precision* — the tension and formality of high-stakes sealed auctions  
**Vibe:** Bloomberg Terminal meets luxury auction house meets cryptographic cipher  
**Palette:**

```css
:root {
  /* Core */
  --bg-void: #050507;
  --bg-surface: #0D0D12;
  --bg-elevated: #141419;
  --bg-overlay: #1C1C24;

  /* Accent */
  --accent-primary: #7BFFC2;   /* Electric mint — the "sealed" color */
  --accent-secondary: #FF6B35; /* Urgent amber — for reveals, warnings */
  --accent-gold: #FFD166;      /* Winner gold */

  /* Text */
  --text-primary: #F0F0F5;
  --text-secondary: #8888A8;
  --text-muted: #44445A;

  /* Status */
  --status-commit: #7BFFC2;
  --status-reveal: #FF6B35;
  --status-ended: #8888A8;
  --status-won: #FFD166;

  /* Borders */
  --border-subtle: rgba(255,255,255,0.06);
  --border-emphasis: rgba(123,255,194,0.3);
}
```

### 17.2 Typography
```css
/* Display / Hero */
font-family: 'Monument Extended', 'Clash Display', sans-serif;

/* Body */
font-family: 'DM Mono', 'IBM Plex Mono', monospace;

/* UI Labels */
font-family: 'Geist', 'Space Grotesk', sans-serif;
```

- Hash values, addresses, ETH amounts displayed in monospace
- Phase labels in uppercase tracking-widest
- Numbers in tabular figures for alignment

### 17.3 Component Patterns

**Auction Card:**
- Dark glass-morphism surface (`backdrop-filter: blur(12px)`)
- Phase indicator: pulsing colored dot + countdown
- Hover: subtle upward float + border glow

**Phase Badge:**
- COMMIT: mint background, pulsing animation
- REVEAL: amber background, urgency flicker
- ENDED: muted gray, no animation

**Button Variants:**
- `primary`: solid accent-primary, dark text, hover glow
- `secondary`: outlined border-emphasis
- `danger`: red outline for cancel/exit
- `wallet`: gradient border animated shimmer

**Input Fields:**
- Dark surface, monospace font for hash/address inputs
- Real-time hash preview below bid amount input
- Success/error states with colored left border

---

## 18. Animations & Motion Design

### 18.1 Page Transitions
```typescript
// Framer Motion page wrapper
const pageVariants = {
  initial: { opacity: 0, y: 20, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
};
```

### 18.2 Key Animations

| Element | Animation |
|---|---|
| Hero title | Staggered character reveal (letter by letter) |
| Auction cards | Staggered grid entrance (50ms delay between cards) |
| Phase countdown | Smooth decrementing, color pulse at <5min |
| Hash preview | Typewriter effect as user types bid amount |
| Commit confirmation | Hash "locking" animation — characters scramble then lock |
| Reveal confirmation | Decrypt animation — masked → revealed characters |
| Winner banner | Confetti burst + gold glow pulse |
| Refund claim | Amount counting up + checkmark stamp |
| Phase transition | Full-width scan line + phase label morph |
| Wallet connect | Connection beam animation |

### 18.3 Loading States
- Skeleton shimmer on auction cards (dark shimmer, not grey)
- Orbiting dot spinner for tx pending states
- Progress bar during contract deployment

---

## 19. Notifications & Real-Time Updates

### 19.1 Notification Types
| Type | Trigger | Channel |
|---|---|---|
| `PHASE_COMMIT_START` | Auction enters commit phase | Toast + Email |
| `PHASE_REVEAL_START` | Auction enters reveal phase | Toast + Email |
| `PHASE_REVEAL_REMINDER` | 1 hour before reveal_end | Email |
| `BID_COMMITTED` | Your commit tx confirmed | Toast |
| `BID_REVEALED` | Your reveal tx confirmed | Toast |
| `AUCTION_WON` | You are the winner | Toast + Email + Banner |
| `REFUND_AVAILABLE` | Your refund is claimable | Toast + Badge |
| `REFUND_CLAIMED` | Refund tx confirmed | Toast |

### 19.2 Notification Bell
- Header badge with unread count
- Dropdown panel with grouped notifications
- Mark as read on click / mark all read

### 19.3 Realtime Implementation
- Supabase Realtime subscription on `notifications` table (filtered by `user_id`)
- On-chain events polled via Wagmi `useContractEvent` hooks
- Sonner toasts for ephemeral alerts

---

## 20. API Contracts

### 20.1 Supabase Edge Functions

**POST `/functions/v1/verify-wallet-signature`**
```json
Request:
{
  "address": "0x...",
  "signature": "0x...",
  "nonce": "uuid"
}

Response:
{
  "success": true,
  "wallet_address": "0x..."
}
```

**POST `/functions/v1/sync-auction-status`**
```json
// Internal cron — no request body
Response:
{
  "updated": 3,
  "auctions": ["uuid1", "uuid2", "uuid3"]
}
```

### 20.2 Wagmi Contract Hooks (Frontend)

```typescript
// Commit bid
const { write: commitBid } = useContractWrite({
  address: auctionAddress,
  abi: SealBidAuctionABI,
  functionName: 'commit',
  value: depositWei,
});

// Reveal bid
const { write: revealBid } = useContractWrite({
  address: auctionAddress,
  abi: SealBidAuctionABI,
  functionName: 'reveal',
  args: [amountWei, secretBytes32],
});

// Claim refund
const { write: claimRefund } = useContractWrite({
  address: auctionAddress,
  abi: SealBidAuctionABI,
  functionName: 'claimRefund',
});
```

---

## 21. Environment & Configuration

### 21.1 Environment Variables

```env
# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Web3
VITE_WALLETCONNECT_PROJECT_ID=xxx
VITE_CHAIN_ID=11155111
VITE_FACTORY_CONTRACT_ADDRESS=0x...
VITE_RPC_URL=https://sepolia.infura.io/v3/xxx

# App
VITE_APP_NAME=SealBid
VITE_APP_URL=https://sealbid.app
```

### 21.2 Chain Configuration
- **Development:** Hardhat local node (chainId 31337)
- **Staging/Hackathon:** Sepolia testnet (chainId 11155111)
- **Production:** Ethereum mainnet (chainId 1)

---

## 22. Testing Strategy

### 22.1 Smart Contract Tests (Hardhat + Chai)
```
tests/
├── commit-reveal.test.ts       # Core happy path
├── refund-reentrancy.test.ts   # Reentrancy attack simulation
├── vickrey.test.ts             # Second-price correctness
├── phase-transitions.test.ts  # State machine edges
├── invalid-reveal.test.ts     # Hash mismatch, wrong phase
└── factory.test.ts            # Factory deployment
```

**Critical test cases:**
- Commit in REVEAL phase must revert
- Reveal with wrong secret must revert
- Reentrancy attack on `claimRefund` must fail
- Vickrey: winner pays correct second price
- All losers can claim full deposit
- Non-revealer gets penalized deposit, remainder claimable

### 22.2 Frontend Tests (Vitest + Testing Library)
- Hash generation: `generateCommitHash` produces correct output
- Reveal validation: correct/incorrect secret detection
- Phase countdown: correct rendering
- Auth flow: login, register, wallet connect

### 22.3 E2E Tests (Playwright)
- Full auction lifecycle on local Hardhat node
- Create → Commit → Reveal → Finalize → Claim Refund

---

## 23. Deployment & DevOps

### 23.1 Deployment Pipeline

```
Developer pushes to main
        │
        ▼
GitHub Actions CI
├── hardhat test (all contract tests must pass)
├── vitest (frontend tests)
├── tsc --noEmit (TypeScript check)
└── build (Vite build)
        │
        ▼
Vercel Preview Deploy (PR)
        │  (on merge to main)
        ▼
Vercel Production Deploy
+ Supabase migrations run
+ Contract deployed to Sepolia
```

### 23.2 Supabase Migrations
- Managed via `supabase/migrations/` folder
- `supabase db push` in CI for staging
- RLS policies included in migrations

### 23.3 Contract Deployment
```bash
npx hardhat run scripts/deploy.ts --network sepolia
# Output: Factory contract address → update VITE_FACTORY_CONTRACT_ADDRESS
```

---

## 24. Bonus Features Roadmap

| Feature | Priority | Description |
|---|---|---|
| Dutch Auction Mode | P1 | Price starts high, decrements over time; first revealed bid wins at current price |
| Multiple Concurrent Auctions | P0 (MVP) | Factory pattern supports this already |
| Automatic Refund Batching | P1 | `batchScheduleRefunds()` callable by anyone post-reveal |
| ZK Proofs | P2 | Use Noir/Circom to prove bid validity without revealing amount during reveal phase |
| Whitelist Auctions | P1 | Merkle tree of allowed bidders |
| Auction Analytics Dashboard | P2 | Charts: bid distribution, reveal rate, gas costs |
| ENS Integration | P2 | Display ENS names instead of raw addresses |
| NFT Auto-Transfer | P1 | On winner determination, auto-transfer NFT from creator escrow |
| Mobile PWA | P2 | Installable PWA with push notifications |

---

## 25. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Bidder loses secret | Medium | High | Encrypted Supabase backup + mandatory JSON download |
| Reentrancy in refund | Low | Critical | `nonReentrant` + pull-payment + CEI pattern + tests |
| Phase transition failure | Medium | High | Supabase cron + user-triggerable finalize |
| Front-end hash mismatch | Medium | High | Pre-reveal validation + clear error messaging |
| Supabase downtime | Low | Medium | Contract is source of truth; off-chain data is supplementary |
| Gas spike on Ethereum | Medium | Medium | Clear gas estimate shown before tx; testnet for hackathon |
| No valid reveals (all bidders forget secrets) | Low | Medium | Auction creator can cancel post-reveal with refunds |

---

## 26. Glossary

| Term | Definition |
|---|---|
| **Commit Hash** | `keccak256(amount, secret, bidderAddress)` — the on-chain sealed bid |
| **Secret** | Random string known only to bidder; required for reveal |
| **Reveal Phase** | Period after commit phase ends; bidders publish plaintext bids |
| **Pull-Payment** | Pattern where users claim their own refunds (vs contract pushing ETH) |
| **CEI Pattern** | Checks-Effects-Interactions — order of operations to prevent reentrancy |
| **Reentrancy** | Attack where a contract calls back into itself during ETH transfer |
| **Vickrey Auction** | Sealed-bid auction where winner pays second-highest price |
| **MEV / Front-running** | Bots inserting transactions ahead of others by seeing the mempool |
| **Deposit** | ETH locked during commit; must be ≥ bid amount; refunded for losers |
| **RLS** | Row Level Security — Supabase/PostgreSQL per-row access control |
| **Factory Pattern** | Contract that deploys other contracts (one factory → many auctions) |
| **nonReentrant** | OpenZeppelin modifier that prevents recursive calls |

---

*PRD Version 1.0.0 — SealBid Hackathon Submission | PS 7: Sealed-Bid Auction*  
*Built for Web3 Hackathon — Privacy / ZK Track*
