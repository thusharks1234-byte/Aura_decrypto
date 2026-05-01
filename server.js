require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API Routes
app.all('/api/cron', require('./api/cron.js'));
app.all('/api/send-email', require('./api/send-email.js'));

// Serve frontend static files
const distPath = path.join(__dirname, 'Aura_decrypto', 'dist');
app.use(express.static(distPath));

// Catch-all to serve index.html for React router
app.use((req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
