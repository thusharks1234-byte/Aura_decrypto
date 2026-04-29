const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, text, html } = req.body;

  // Use environment variables for security
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.VITE_GMAIL_USER || process.env.EMAIL_USER,
      pass: process.env.VITE_GMAIL_PASS || process.env.EMAIL_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"Aura Decrypto" <${process.env.VITE_GMAIL_USER || process.env.EMAIL_USER}>`,
      to,
      subject: subject || 'Aura Decrypto Auction Update',
      text,
      html,
    });

    console.log('Message sent: %s', info.messageId);
    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
};
