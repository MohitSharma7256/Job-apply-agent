# Google OAuth Setup Guide for Job Apply Agent

## Required Configuration in Supabase Dashboard

### 1. Enable Google OAuth Provider
1. Go to your Supabase Project Dashboard
2. Navigate to **Authentication** → **Providers**
3. Enable **Google** provider
4. Add your Google OAuth credentials:
   - **Client ID**: Get from Google Cloud Console
   - **Client Secret**: Get from Google Cloud Console

### 2. Configure Redirect URLs
In the Google OAuth provider settings, add these redirect URLs:
```
https://swktqdbnajnykpfgfvxp.supabase.co/auth/v1/callback
https://job-apply-agent-hrc1.onrender.com/login
http://localhost:3000/login (for development)
```

### 3. Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Select **Web application**
6. Add authorized redirect URIs:
   ```
   https://swktqdbnajnykpfgfvxp.supabase.co/auth/v1/callback
   https://job-apply-agent-hrc1.onrender.com/login
   ```
7. Copy the Client ID and Client Secret to Supabase

### 4. Enable Required APIs
Make sure these APIs are enabled in Google Cloud Console:
- Google+ API
- Google OAuth2 API

## Common Issues and Solutions

### 400 Bad Request Error
- **Cause**: Missing or incorrect redirect URI configuration
- **Fix**: Ensure the redirect URI in Google Cloud Console matches exactly what's in Supabase

### Invalid Client Error
- **Cause**: Incorrect Client ID or Client Secret
- **Fix**: Double-check credentials in both Google Cloud Console and Supabase

### Redirect Loop
- **Cause**: OAuth callback not handled properly
- **Fix**: Check that the redirect URL is correctly configured

## Testing OAuth Flow

1. Clear browser cookies and localStorage
2. Navigate to `/login`
3. Click "Continue with Google"
4. Check browser console for detailed error messages
5. Verify the redirect URL in the browser address bar

## Environment Variables Required
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Debugging Tips
- Check browser network tab for the exact OAuth request URL
- Look for error parameters in the URL hash after redirect
- Ensure the Supabase project is not paused
- Verify that the site URL in Supabase matches your deployment URL
