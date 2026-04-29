import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://bzsqxcrvgyqvfsvtramx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6c3F4Y3J2Z3lxdmZzdnRyYW14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNjg4MDcsImV4cCI6MjA5Mjk0NDgwN30.FyGyF8BXBwI_APCdtQe7QsGBFfpQc8WXIDCQANgPTqs'
);

async function test() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'http://localhost:5173/dashboard'
    }
  });
  console.log('Data:', data);
  console.log('Error:', error);
}

test();
