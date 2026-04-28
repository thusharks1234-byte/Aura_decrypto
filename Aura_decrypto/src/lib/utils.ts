import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility for merging Tailwind classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a wallet address to a shorter version
 */
export function shortenAddress(address: string) {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

/**
 * Formats big number strings (wei) to ETH display
 */
export function formatEth(wei: string | number) {
  if (!wei) return '0';
  const eth = Number(wei) / 1e18;
  return eth.toLocaleString(undefined, { maximumFractionDigits: 4 });
}
