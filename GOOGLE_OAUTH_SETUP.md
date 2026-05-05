# Google OAuth Setup Guide for Supabase

## Error: "Unsupported provider: missing OAuth secret"

This error occurs when Google OAuth is not configured in your Supabase Dashboard. Follow this guide to properly set up Google OAuth authentication.

---

## Prerequisites

- A Google account
- Access to [Google Cloud Console](https://console.cloud.google.com/)
- Access to your [Supabase Dashboard](https://app.supabase.com/)
- Your Supabase project URL (format: `https://<project-ref>.supabase.co`)

---

## Step 1: Create Google Cloud Console Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top of the page
3. Click **"New Project"**
4. Enter a project name (e.g., "Job Apply Agent")
5. Click **"Create"**
6. Wait for the project to be created and select it

> **Screenshot Reference**: Look for the project selector dropdown at the top of the Google Cloud Console page

---

## Step 2: Configure OAuth Consent Screen

1. In the Google Cloud Console, navigate to **APIs & Services** > **OAuth consent screen**
2. Select **"External"** user type (unless you have Google Workspace)
3. Click **"Create"**
4. Fill in the required fields:
   - **App name**: Your application name (e.g., "Job Apply Agent")
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
5. Click **"Save and Continue"**
6. On the **Scopes** page, click **"Save and Continue"** (default scopes are sufficient)
7. On the **Test users** page, click **"Save and Continue"**
8. Review and click **"Back to Dashboard"**

> **Screenshot Reference**: The OAuth consent screen configuration page with tabs for App Information, Scopes, Test Users, and Summary

---

## Step 3: Create OAuth 2.0 Credentials

1. In Google Cloud Console, go to **APIs & Services** > **Credentials**
2. Click **"+ Create Credentials"** at the top
3. Select **"OAuth client ID"**
4. Configure the OAuth client:
   - **Application type**: Select **"Web application"**
   - **Name**: Enter a name (e.g., "Job Apply Agent Web Client")
   - **Authorized JavaScript origins**: (optional for now)
   - **Authorized redirect URIs**: Add the following URI (see Step 4 for the exact URL)
5. Click **"Create"**
6. **IMPORTANT**: Copy the **Client ID** and **Client Secret** that appear in the popup
   - You'll need these for Supabase configuration
   - Click **"OK"** to close the popup

> **Screenshot Reference**: The "Create OAuth client ID" dialog showing Application type, Name, and Authorized redirect URIs fields

---

## Step 4: Get Your Supabase Redirect URL

Before adding the redirect URI to Google Cloud Console, you need your Supabase callback URL:

**Format:**
```
https://<your-project-ref>.supabase.co/auth/v1/callback
```

**How to find your Project Ref:**
1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Click on the **Settings** icon (gear) in the sidebar
4. Click **"General"** under Project Settings
5. Look for **"Reference ID"** or **"Project ID"** - this is your project reference

**Example Redirect URL:**
```
https://abcdefghijklm.supabase.co/auth/v1/callback
```

---

## Step 5: Add Redirect URI to Google Cloud Console

1. Go back to **Google Cloud Console** > **APIs & Services** > **Credentials**
2. Find the OAuth client you just created and click the **Edit** icon (pencil)
3. Under **Authorized redirect URIs**, click **"+ Add URI"**
4. Enter your Supabase callback URL:
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```
5. Click **"Save"**

> **Screenshot Reference**: The OAuth client edit page showing the "Authorized redirect URIs" section with the "Add URI" button

---

## Step 6: Configure Google OAuth in Supabase Dashboard

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. In the left sidebar, click **Authentication** (icon looks like a shield)
4. Click **"Providers"** in the Authentication section
5. Scroll down to find **"Google"** in the list of providers
6. Click on **"Google"** to expand the configuration

---

## Step 7: Enable Google Provider and Add Credentials

1. In the Google provider settings:
   - Toggle **"Enable sign in with Google"** to **ON**
   - **Client ID**: Paste the Client ID you copied from Google Cloud Console
   - **Client Secret**: Paste the Client Secret you copied from Google Cloud Console
2. Click **"Save"**

> **Screenshot Reference**: The Google provider configuration card in Supabase Dashboard showing the Enable toggle, Client ID field, and Client Secret field

---

## Step 8: Verify Configuration

1. In Supabase Dashboard, go to **Authentication** > **Providers**
2. Ensure Google shows as **"Enabled"** with a green indicator
3. Test the OAuth flow in your application

---

## Common Issues and Troubleshooting

### Issue: "Unsupported provider: missing OAuth secret"
**Cause**: Google OAuth is not enabled or credentials are not saved in Supabase.
**Solution**: Follow Steps 6-7 to enable Google and add Client ID/Secret.

### Issue: "redirect_uri_mismatch"
**Cause**: The redirect URI in Google Cloud Console doesn't match the Supabase callback URL.
**Solution**: Ensure the redirect URI in Google Cloud Console exactly matches:
```
https://<your-project-ref>.supabase.co/auth/v1/callback
```

### Issue: "Error 400: invalid_request"
**Cause**: OAuth consent screen not properly configured.
**Solution**: Complete Step 2 (OAuth consent screen) fully before creating credentials.

### Issue: "access_denied" after authentication
**Cause**: Test user not added (for external apps in testing mode).
**Solution**: In Google Cloud Console > OAuth consent screen > Test users, add the email addresses that will test the app.

---

## Quick Reference: Required Values

| Item | Where to Find | Example |
|------|---------------|---------|
| Supabase Project Ref | Supabase Dashboard > Settings > General | `abcdefghijklm` |
| Supabase Redirect URL | Construct from project ref | `https://abcdefghijklm.supabase.co/auth/v1/callback` |
| Google Client ID | Google Cloud Console > Credentials | `123456789-abc.apps.googleusercontent.com` |
| Google Client Secret | Google Cloud Console > Credentials | `GOCSPX-xxxxxxxxxxxx` |

---

## Code Integration (Optional)

Once Google OAuth is configured in Supabase, you can use the following code to sign in:

```javascript
// Using Supabase JS Client
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
});
```

```javascript
// Using Supabase JS Client with additional scopes
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    scopes: 'email profile',
    queryParams: {
      access_type: 'offline',
      prompt: 'consent',
    },
  },
});
```

---

## Additional Resources

- [Supabase Auth with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)

---

## Checklist

- [ ] Google Cloud Console project created
- [ ] OAuth consent screen configured
- [ ] OAuth 2.0 Client ID created
- [ ] Client ID and Client Secret copied
- [ ] Redirect URI added to Google Cloud Console
- [ ] Google provider enabled in Supabase Dashboard
- [ ] Client ID pasted into Supabase
- [ ] Client Secret pasted into Supabase
- [ ] Configuration saved in Supabase
- [ ] Test authentication flow

---

**Last Updated**: May 2026
