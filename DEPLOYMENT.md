# Job Apply Agent - Deployment Guide

## Quick Fix for 429 Error (AI Quota Exceeded)

Your Google AI quota is exceeded. Here's how to fix it:

### Option 1: Use Keyword-Based Fallback (RECOMMENDED - No API needed)

The app now has built-in keyword-based scoring that works WITHOUT any AI API.

**Just redeploy without the GOOGLE_AI_API_KEY:**

1. Go to Vercel Dashboard
2. Remove or clear the `GOOGLE_AI_API_KEY` environment variable
3. Redeploy

The app will use keyword matching instead of AI.

---

### Option 2: Get a New Google AI Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Create a new API key (it resets daily)
3. Wait for quota to reset (usually 24 hours)
4. Update the key in Vercel

---

### Option 3: Use OpenAI (Paid but Reliable)

```env
OPENAI_API_KEY=your_openai_key_here
AI_PROVIDER=openai
AI_MODEL=gpt-4o-mini
```

---

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `GOOGLE_AI_API_KEY` | No* | Google AI (FREE) - app works without it |
| `OPENAI_API_KEY` | No | OpenAI alternative |
| `AI_PROVIDER` | No | `google` or `openai` |
| `AI_MODEL` | No | Model name |

*App works 100% without AI API using keyword-based fallback

---

## Redeploy Now:

```bash
# Remove AI key from Vercel env vars, then:
vercel --prod
```

The app will immediately work with keyword-based scoring! 🚀