/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

interface WalletContextType {
  address: string | null;
  balance: string | null; // Balance in ETH
  chainId: number | null;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  isConnected: boolean;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | null>(null);

const SEPOLIA_CHAIN_ID = '0xaa36a7';
const SEPOLIA_RPC_URL = 'https://rpc.sepolia.org';

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const refreshBalance = useCallback(async () => {
    if (!window.ethereum || !address) return;
    try {
      const balHex = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      }) as string;
      const balWei = BigInt(balHex);
      const balEth = (Number(balWei) / 1e18).toFixed(4);
      setBalance(balEth);
    } catch (e) {
      console.error('Failed to fetch balance:', e);
    }
  }, [address]);

  useEffect(() => {
    if (address) {
      const timer = setTimeout(() => refreshBalance(), 0);
      return () => clearTimeout(timer);
    } else {
      setBalance(null);
    }
  }, [address, refreshBalance]);

  const switchToTestnet = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
    } catch (switchError: unknown) {
      if ((switchError as { code: number }).code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: SEPOLIA_CHAIN_ID,
                chainName: 'Sepolia Testnet',
                rpcUrls: [SEPOLIA_RPC_URL],
                nativeCurrency: { name: 'Sepolia Ether', symbol: 'SEP', decimals: 18 },
                blockExplorerUrls: ['https://sepolia.etherscan.io'],
              },
            ],
          });
        } catch (addError) {
          console.error('Failed to add network:', addError);
        }
      } else {
        console.error('Failed to switch network:', switchError);
      }
    }
  };

  useEffect(() => {
    // Check if already connected
    const checkConnection = async () => {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[];
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          const chain = await window.ethereum.request({ method: 'eth_chainId' }) as string;
          setChainId(parseInt(chain, 16));
          if (chain !== SEPOLIA_CHAIN_ID) {
            switchToTestnet();
          }
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
      if (chain !== SEPOLIA_CHAIN_ID) {
        await switchToTestnet();
      }
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
    <WalletContext.Provider value={{ address, balance, chainId, isConnecting, connect, disconnect, isConnected: !!address, refreshBalance }}>
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
