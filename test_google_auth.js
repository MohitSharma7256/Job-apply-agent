import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://swktqdbnajnykpfgfvxp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3a3RxZGJuYWpueWtwZmdmdnhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNzYzMjAsImV4cCI6MjA5Mjg1MjMyMH0.oyuuZiylJy8XjzvqfKVHFr4W5YYkH4QKR7FZkuncGA0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'http://localhost:3000/login',
    }
  });

  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Success:", data);
  }
}

test();
