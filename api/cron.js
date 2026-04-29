const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  // Optional: Verify request is from Vercel Cron
  // if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return res.status(401).end('Unauthorized');
  // }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Missing Supabase environment variables' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { data, error } = await supabase.rpc('auto_transition_auction_statuses');
    
    if (error) throw error;

    console.log('Successfully triggered status transitions');
    return res.status(200).json({ success: true, message: 'Status transitions triggered' });
  } catch (error) {
    console.error('Error triggering status transitions:', error);
    return res.status(500).json({ error: 'Failed to trigger transitions', details: error.message });
  }
};
