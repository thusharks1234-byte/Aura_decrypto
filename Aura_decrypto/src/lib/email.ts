/**
 * Utility to send email notifications via the Vercel API.
 */
export async function sendWinnerEmail(to: string, auctionTitle: string, amountEth: string) {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        subject: `🏆 Congratulations! You won the auction: ${auctionTitle}`,
        text: `You have won the auction for "${auctionTitle}" with a bid of ${amountEth} ETH. Visit the platform to claim your asset.`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h1 style="color: #6366f1;">Congratulations!</h1>
            <p>You have won the auction for <strong>${auctionTitle}</strong>.</p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;">Winning Bid: <strong>${amountEth} ETH</strong></p>
            </div>
            <p>Visit the <a href="${window.location.origin}/dashboard" style="color: #6366f1; font-weight: bold; text-decoration: none;">Aura Decrypto Dashboard</a> to see more details and claim your prize.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 0.8rem; color: #999;">This is an automated message from Aura Decrypto Auction Platform.</p>
          </div>
        `,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to send winner email:', error);
    return { error: 'Failed to send email' };
  }
}
