# YouTube Data API v3 Setup Guide

This guide will walk you through setting up the YouTube Data API v3 for the Kids Screen Curator application.

## Prerequisites

- Google account
- Google Cloud Platform access
- Basic understanding of API keys

## Step-by-Step Setup

### 1. Create or Select a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Either:
   - **Create new project**: Click "Select a project" → "New Project" → Enter project name → "Create"
   - **Use existing project**: Click "Select a project" → Choose your project

### 2. Enable YouTube Data API v3

1. In the Google Cloud Console, make sure your project is selected
2. Go to "APIs & Services" → "Library" (or search "API Library")
3. Search for "YouTube Data API v3"
4. Click on "YouTube Data API v3" from the results
5. Click the **"Enable"** button
6. Wait for the API to be enabled (usually takes a few seconds)

### 3. Create API Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click **"+ Create Credentials"** → "API key"
3. Your API key will be generated and displayed
4. **Important**: Copy this key immediately and store it securely
5. Click "Close"

### 4. (Recommended) Restrict Your API Key

For security, it's recommended to restrict your API key:

1. In the Credentials page, click on your newly created API key
2. Under "Application restrictions":
   - For development: Choose "None" or "HTTP referrers" with `http://localhost:3000/*`
   - For production: Choose "HTTP referrers" and add your domain
3. Under "API restrictions":
   - Choose "Restrict key"
   - Select "YouTube Data API v3"
4. Click **"Save"**

### 5. Set Up Billing (Required)

⚠️ **Important**: Google Cloud requires billing to be enabled for API usage, even for free tier usage.

1. Go to "Billing" in the Google Cloud Console
2. Click "Link a billing account" or "Create billing account"
3. Follow the prompts to add a payment method
4. **Note**: The YouTube Data API has a generous free quota (10,000 units/day), so you likely won't be charged

### 6. Add API Key to Your Project

1. Open your `.env.local` file
2. Add or update the YouTube API key:
   ```
   YOUTUBE_API_KEY=AIza...your_actual_api_key_here
   ```
3. Save the file

### 7. Test Your API Key

Run the test script to verify your setup:

```bash
node scripts/test-youtube-api.js
```

## Understanding API Quotas

The YouTube Data API has usage quotas:

- **Default quota**: 10,000 units per day
- **Search operation**: ~100 units per request
- **Video details**: ~1 unit per video

### Quota Usage in Our App:
- Getting 10 recommendations: ~1,000 units
- Daily usage with moderate activity: ~2,000-5,000 units

## Common Issues and Solutions

### ❌ "API key not valid" Error

**Causes:**
- Incorrect API key
- API key restrictions too strict
- YouTube Data API v3 not enabled

**Solutions:**
1. Double-check the API key in `.env.local`
2. Verify YouTube Data API v3 is enabled
3. Check API key restrictions
4. Regenerate the API key if needed

### ❌ "Quota exceeded" Error

**Causes:**
- Used more than 10,000 units in 24 hours
- Multiple developers using the same key

**Solutions:**
1. Wait for quota to reset (24 hours)
2. Request quota increase in Google Cloud Console
3. Optimize API usage in the application

### ❌ "Billing must be enabled" Error

**Causes:**
- No billing account linked to the project
- Billing account is disabled

**Solutions:**
1. Enable billing in Google Cloud Console
2. Add a valid payment method
3. Ensure billing account is active

### ❌ "Access forbidden" Error

**Causes:**
- API key restrictions
- Service account issues
- Project permissions

**Solutions:**
1. Check API key restrictions
2. Verify project permissions
3. Ensure the API key has access to YouTube Data API v3

## Testing Your Setup

After completing the setup, test your configuration:

1. **Run the test script**:
   ```bash
   node scripts/test-youtube-api.js
   ```

2. **Check the application**:
   - Start your development server: `npm run dev`
   - Create a child profile with interests
   - Go to the Recommendations page
   - Check browser console for detailed logs

3. **Expected behavior**:
   - Test script shows successful API calls
   - Recommendations page loads videos
   - Console shows YouTube API logs

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for API keys
3. **Restrict API keys** to specific domains/IPs
4. **Monitor API usage** regularly
5. **Rotate API keys** periodically

## API Key Restrictions for Production

When deploying to production:

1. **HTTP referrers**: Add your production domain
   ```
   https://yourdomain.com/*
   https://*.yourdomain.com/*
   ```

2. **IP addresses**: Add your server IPs if using server-side rendering

3. **API restrictions**: Keep only YouTube Data API v3 enabled

## Monitoring Usage

1. Go to Google Cloud Console → "APIs & Services" → "Dashboard"
2. Select "YouTube Data API v3"
3. View usage statistics and quotas
4. Set up alerts for quota usage

## Troubleshooting Commands

If you're having issues, try these debugging steps:

```bash
# Test API key
node scripts/test-youtube-api.js

# Check environment variables
node -e "console.log(process.env.YOUTUBE_API_KEY)"

# Start development server with detailed logs
npm run dev
```

## Getting Help

If you continue to have issues:

1. Check the test script output for specific error messages
2. Review Google Cloud Console for API usage and errors
3. Verify all setup steps were completed
4. Check the application logs in the browser console

## Cost Estimation

With the free tier (10,000 units/day):
- **Light usage**: 50-100 recommendation requests/day = FREE
- **Medium usage**: 200-500 recommendation requests/day = FREE  
- **Heavy usage**: 1000+ recommendation requests/day = May exceed free tier

Most users will stay well within the free quota limits.