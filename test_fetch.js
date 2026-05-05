import fetch from 'node-fetch';

async function test() {
  const url = 'https://swktqdbnajnykpfgfvxp.supabase.co/auth/v1/authorize?provider=google&redirect_to=http%3A%2F%2Flocalhost%3A3000%2Flogin';
  const response = await fetch(url);
  console.log("Status:", response.status);
  const text = await response.text();
  console.log("Response:", text);
}

test();
