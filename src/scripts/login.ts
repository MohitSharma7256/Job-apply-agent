/**
 * LOCAL LOGIN SCRIPT - Run this on your computer (NOT on Vercel)
 * 
 * Usage: npx ts-node src/scripts/login.ts <platform>
 * Example: npx ts-node src/scripts/login.ts naukri
 * 
 * This script:
 * 1. Opens a real Chrome browser
 * 2. You log in manually
 * 3. Captures session cookies
 * 4. Saves them encrypted to Supabase
 */

import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
import * as readline from 'readline';

dotenv.config();

const PLATFORM_URLS: Record<string, { loginUrl: string; dashboardUrl: string; successPattern: RegExp }> = {
  naukri: {
    loginUrl: 'https://www.naukri.com/nlogin/login',
    dashboardUrl: 'https://www.naukri.com/',
    successPattern: /naukri\.com\/(mnjuser|dashboard|my-naukri)/,
  },
  linkedin: {
    loginUrl: 'https://www.linkedin.com/login',
    dashboardUrl: 'https://www.linkedin.com/feed/',
    successPattern: /linkedin\.com\/(feed|in\/|jobs\/)/,
  },
  indeed: {
    loginUrl: 'https://secure.indeed.com/auth',
    dashboardUrl: 'https://www.indeed.com/',
    successPattern: /indeed\.com\/(account|my-jobs|job-alerts)/,
  },
  shine: {
    loginUrl: 'https://www.shine.com/login',
    dashboardUrl: 'https://www.shine.com/',
    successPattern: /shine\.com\/(job-seeker|dashboard|myshine)/,
  },
  apna: {
    loginUrl: 'https://www.apna.co/login',
    dashboardUrl: 'https://www.apna.co/',
    successPattern: /apna\.co\/(jobs|profile|dashboard)/,
  },
};

function encrypt(text: string): string {
  const key = Buffer.from((process.env.SESSION_ENCRYPTION_KEY || 'job-agent-default-key-32-chars!!').padEnd(32).slice(0, 32));
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

async function waitForUser(prompt: string): Promise<void> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(prompt, () => { rl.close(); resolve(); }));
}

async function loginAndCapture(platform: string, userId: string = 'default-user') {
  const config = PLATFORM_URLS[platform];
  if (!config) {
    console.error(`❌ Unknown platform: ${platform}`);
    console.log(`Available platforms: ${Object.keys(PLATFORM_URLS).join(', ')}`);
    process.exit(1);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase credentials missing in .env file');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log(`\n🚀 Starting Manual Login for: ${platform.toUpperCase()}`);
  console.log('━'.repeat(50));

  // Launch headed browser (real visible Chrome)
  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized'],
  });

  const context = await browser.newContext({
    viewport: null,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();

  console.log(`\n📂 Opening ${platform} login page...`);
  await page.goto(config.loginUrl, { waitUntil: 'domcontentloaded' });

  console.log(`\n✋ Please log in manually in the browser window.`);
  console.log(`   After logging in successfully, come back here and press ENTER.`);
  console.log(`\n   Waiting for you to complete login...`);

  // Wait for user to manually login
  await waitForUser('\n   Press ENTER after you have logged in successfully: ');

  // Verify login success
  const currentUrl = page.url();
  const isLoggedIn = config.successPattern.test(currentUrl);

  if (!isLoggedIn) {
    console.log(`\n⚠️  Could not verify login. Current URL: ${currentUrl}`);
    console.log('   Saving session anyway...');
  } else {
    console.log(`\n✅ Login detected! Capturing session...`);
  }

  // Capture cookies
  const cookies = await context.cookies();
  const localStorage: Record<string, string> = {};

  try {
    const storageItems = await page.evaluate(() => {
      const items: Record<string, string> = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key) items[key] = window.localStorage.getItem(key) || '';
      }
      return items;
    });
    Object.assign(localStorage, storageItems);
  } catch (e) {
    // localStorage might be restricted
  }

  const sessionData = {
    cookies,
    localStorage,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    capturedAt: new Date().toISOString(),
  };

  console.log(`\n💾 Saving session (${cookies.length} cookies captured)...`);

  // Encrypt and save to Supabase
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
    console.error('❌ Failed to save session:', error.message);
  } else {
    console.log(`\n🎉 SUCCESS! Session for ${platform.toUpperCase()} saved to Supabase.`);
    console.log(`   ✅ ${cookies.length} cookies encrypted and stored`);
    console.log(`   ✅ Session valid for 30 days`);
    console.log(`   ✅ Agent will reuse this session automatically`);
  }

  await browser.close();
  console.log('\n✅ Browser closed. You can close this terminal.');
}

// Main
const platform = process.argv[2];
const userId = process.argv[3] || 'default-user';

if (!platform) {
  console.log('Usage: npx ts-node src/scripts/login.ts <platform> [userId]');
  console.log('Platforms: naukri, linkedin, indeed, shine, apna');
  process.exit(1);
}

loginAndCapture(platform, userId).catch(err => {
  console.error('❌ Login failed:', err.message);
  process.exit(1);
});
