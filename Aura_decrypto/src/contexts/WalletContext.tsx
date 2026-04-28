import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface WalletContextType {
  address: string | null;
  chainId: number | null;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  isConnected: boolean;
}

const WalletContext = createContext<WalletContextType | null>(null);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Check if already connected
    const checkConnection = async () => {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[];
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          const chain = await window.ethereum.request({ method: 'eth_chainId' }) as string;
          setChainId(parseInt(chain, 16));
        }
      }
    };
    checkConnection();

    // Listen for account/chain changes
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', (...args: unknown[]) => {
        const accounts = args[0] as string[];
        setAddress(accounts[0] || null);
      });
      window.ethereum.on('chainChanged', (...args: unknown[]) => {
        const chain = args[0] as string;
        setChainId(parseInt(chain, 16));
      });
    }
  }, []);

  const connect = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('MetaMask not detected. Please install MetaMask extension.');
      return;
    }
    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }) as string[];
      setAddress(accounts[0]);
      const chain = await window.ethereum.request({ method: 'eth_chainId' }) as string;
      setChainId(parseInt(chain, 16));
    } catch (e) {
      console.error('Wallet connect failed:', e);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAddress(null);
    setChainId(null);
  };

  return (
    <WalletContext.Provider value={{ address, chainId, isConnecting, connect, disconnect, isConnected: !!address }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used inside WalletProvider');
  return ctx;
};

// Extend window type for ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, cb: (...args: unknown[]) => void) => void;
    };
  }
}
