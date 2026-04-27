/**
 * LOCAL LOGIN SCRIPT - Run with: node src/scripts/login.js <platform>
 * Example: node src/scripts/login.js naukri
 */

const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const readline = require('readline');
require('dotenv').config();

const PLATFORM_URLS = {
  naukri: {
    loginUrl: 'https://www.naukri.com/nlogin/login',
    successPattern: /naukri\.com\/(mnjuser|dashboard|my-naukri)/,
  },
  linkedin: {
    loginUrl: 'https://www.linkedin.com/login',
    successPattern: /linkedin\.com\/(feed|in\/|jobs\/)/,
  },
  indeed: {
    loginUrl: 'https://secure.indeed.com/auth',
    successPattern: /indeed\.com\/(account|my-jobs)/,
  },
  apna: {
    loginUrl: 'https://www.apna.co/login',
    successPattern: /apna\.co\/(jobs|profile|dashboard)/,
  },
  shine: {
    loginUrl: 'https://www.shine.com/login',
    successPattern: /shine\.com\/(job-seeker|dashboard)/,
  },
};

function encrypt(text) {
  const key = Buffer.from(
    (process.env.SESSION_ENCRYPTION_KEY || 'job-agent-default-key-32-chars!!').padEnd(32).slice(0, 32)
  );
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

async function waitForEnter(prompt) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(prompt, () => { rl.close(); resolve(); }));
}

async function loginAndCapture(platform, userId = 'default-user') {
  const config = PLATFORM_URLS[platform];
  if (!config) {
    console.error(`❌ Unknown platform: ${platform}`);
    console.log(`Available: ${Object.keys(PLATFORM_URLS).join(', ')}`);
    process.exit(1);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase credentials missing in .env file!');
    console.log('Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env file');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log(`\n🚀 Starting Manual Login for: ${platform.toUpperCase()}`);
  console.log('━'.repeat(50));
  console.log('📂 Opening browser...\n');

  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized'],
  });

  const context = await browser.newContext({ viewport: null });
  const page = await context.newPage();

  await page.goto(config.loginUrl, { waitUntil: 'domcontentloaded' });

  console.log(`✋ Browser khul gaya!`);
  console.log(`   ${platform.toUpperCase()} ka login page open hai.`);
  console.log(`   Apna username aur password daalkar MANUALLY login karein.`);
  console.log(`\n   Login hone ke baad YAHAN wapas aao aur ENTER dabaao.\n`);

  await waitForEnter('   ▶ Login ke baad ENTER dabaao: ');

  const cookies = await context.cookies();
  
  const sessionData = {
    cookies,
    localStorage: {},
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    capturedAt: new Date().toISOString(),
  };

  console.log(`\n💾 Session save kar raha hoon... (${cookies.length} cookies captured)`);

  const encryptedData = encrypt(JSON.stringify(sessionData));
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from('sessions')
    .upsert({
      id: `${userId}-${platform}`,
      platform,
      user_id: userId,
      encrypted_data: encryptedData,
      expires_at: expiresAt,
      is_valid: true,
      created_at: new Date().toISOString(),
    }, { onConflict: 'id' });

  if (error) {
    console.error('\n❌ Session save nahi hua:', error.message);
    console.log('   Supabase mein sessions table banao phir try karo.');
  } else {
    console.log(`\n🎉 SUCCESS! ${platform.toUpperCase()} ka session save ho gaya!`);
    console.log(`   ✅ ${cookies.length} cookies encrypted hokar Supabase mein store hain`);
    console.log(`   ✅ Session 30 din tak valid rahega`);
    console.log(`   ✅ Agent automatically reuse karega`);
    console.log(`\n   Ab Dashboard → Settings par check karo.`);
  }

  await browser.close();
}

const platform = process.argv[2];
const userId = process.argv[3] || 'default-user';

if (!platform) {
  console.log('Usage: node src/scripts/login.js <platform>');
  console.log('Platforms: naukri, linkedin, indeed, apna, shine');
  process.exit(1);
}

loginAndCapture(platform, userId).catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
