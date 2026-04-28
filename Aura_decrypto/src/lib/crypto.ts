import { ethers } from 'ethers';

/**
 * Generates a cryptographically secure random secret
 */
export function generateSecret(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Computes the commit hash: keccak256(amount || secret || bidderAddress)
 * Matches the on-chain Solidity implementation
 */
export function computeCommitHash(
  amountWei: string,
  secret: string,
  bidderAddress: string
): string {
  return ethers.solidityPackedKeccak256(
    ['uint256', 'bytes32', 'address'],
    [BigInt(amountWei), secret, bidderAddress]
  );
}

/**
 * Converts ETH string to wei BigInt string
 */
export function ethToWei(eth: string): string {
  return ethers.parseEther(eth).toString();
}

/**
 * Converts wei BigInt string to ETH string
 */
export function weiToEth(wei: string): string {
  return ethers.formatEther(BigInt(wei));
}

/**
 * Generates a downloadable backup JSON for a bid commitment
 */
export function generateBidBackup(data: {
  auctionId: string;
  auctionTitle: string;
  amountEth: string;
  secret: string;
  commitHash: string;
  bidderAddress: string;
  timestamp: string;
}): string {
  return JSON.stringify({ ...data, warning: 'Keep this file safe. You need the secret to reveal your bid.' }, null, 2);
}

/**
 * Downloads a file to the user's device
 */
export function downloadFile(content: string, filename: string, type = 'application/json') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Validates that a commit hash matches the given inputs (for reveal verification)
 */
export function verifyCommitHash(
  amountWei: string,
  secret: string,
  bidderAddress: string,
  storedHash: string
): boolean {
  try {
    const computed = computeCommitHash(amountWei, secret, bidderAddress);
    return computed.toLowerCase() === storedHash.toLowerCase();
  } catch {
    return false;
  }
}
