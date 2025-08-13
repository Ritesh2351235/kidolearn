# Kids Screen Curator - Debugging Guide

## Quick Test Commands

### 1. Test YouTube API
```bash
npm run test:youtube
```
This will verify your YouTube API key is working correctly.

### 2. Check Environment Variables
```bash
node -e "console.log({
  youtube: !!process.env.YOUTUBE_API_KEY,
  openai: !!process.env.OPENAI_API_KEY,
  clerk_pub: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  clerk_secret: !!process.env.CLERK_SECRET_KEY,
  db: !!process.env.DATABASE_URL
})"
```

### 3. Test Database Connection
```bash
npm run db:generate
npm run db:push
```

## Common Issues & Solutions

### 🔥 "No recommendations found" Error

**Symptoms:**
- Recommendations page shows no videos
- Console shows API errors

**Debugging Steps:**
1. **Check browser console** for detailed error logs
2. **Test YouTube API** with: `npm run test:youtube`
3. **Check child profile** has interests selected
4. **Verify API keys** in `.env.local`

**Common Causes:**
- Invalid YouTube API key
- YouTube API quota exceeded  
- No interests selected for child
- Network issues

### 🖼️ Image Loading Errors

**Symptoms:**
- "Invalid src prop" errors for YouTube thumbnails
- Images not displaying

**Solution:**
Images domains are already configured in `next.config.ts`. If still having issues:

1. Check the thumbnail URLs in console logs
2. Verify Next.js image domains in `next.config.ts`
3. Restart the development server after config changes

### 🔐 Authentication Issues

**Symptoms:**
- Redirected to sign-in repeatedly
- "Unauthorized" errors

**Debugging Steps:**
1. Check Clerk keys in `.env.local`
2. Verify middleware configuration
3. Check browser cookies and local storage

### 🗄️ Database Issues

**Symptoms:**
- Prisma client errors
- Database connection failures

**Solutions:**
```bash
# Regenerate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Reset database (if needed)
npx prisma db push --force-reset
```

## Development Debugging

### Enable Detailed Logging

The application includes extensive console logging. Open browser DevTools → Console to see:

- 🚀 API request starts
- 👶 Child profile information  
- 🔍 YouTube search queries
- 📊 API responses
- ❌ Error details

### Check API Responses

1. Open **Network** tab in DevTools
2. Go to Recommendations page
3. Look for `/api/recommendations` request
4. Check response status and body

### Database Inspection

```bash
# Open Prisma Studio (GUI for database)
npx prisma studio
```

This opens a web interface to view/edit database records.

## Environment Setup Checklist

- [ ] `.env.local` file exists
- [ ] YouTube API key is valid (test with `npm run test:youtube`)
- [ ] OpenAI API key is set
- [ ] Clerk keys are configured
- [ ] Database URL is correct
- [ ] Database schema is pushed (`npm run db:push`)

## Error Code Reference

### YouTube API Errors

- **400**: Bad request - check search parameters
- **403**: Forbidden - invalid API key or quota exceeded
- **404**: Not found - API endpoint issue
- **429**: Too many requests - rate limited

### Clerk Authentication Errors

- **401**: Unauthorized - user not logged in
- **403**: Forbidden - user lacks permissions

### Application Errors

- **500**: Internal server error - check server logs
- **Network errors**: Connection issues - check internet/firewall

## Performance Debugging

### Slow Recommendations Loading

**Causes:**
- YouTube API slow response
- OpenAI API slow response
- Network latency

**Solutions:**
- Check API response times in Network tab
- Reduce number of video recommendations
- Implement caching (future enhancement)

### High API Usage

Monitor usage:
1. YouTube API: [Google Cloud Console](https://console.cloud.google.com)
2. OpenAI API: [OpenAI Dashboard](https://platform.openai.com/usage)

## Getting Help

### 1. Check Logs First
- Browser console (F12)
- Server logs (terminal running `npm run dev`)

### 2. Test Individual Components
- YouTube API: `npm run test:youtube`
- Database: `npx prisma studio`
- Authentication: Try logging out/in

### 3. Verify Environment
- All API keys are valid
- Services are accessible
- Database is connected

### 4. Common Reset Commands
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Reset database schema
npm run db:push

# Regenerate Prisma client
npm run db:generate
```

## Development Workflow

### Making Changes

1. **Code changes**: Auto-reload with `npm run dev`
2. **Schema changes**: Run `npm run db:push`
3. **Environment changes**: Restart dev server
4. **Image config changes**: Restart dev server

### Testing Changes

1. **YouTube integration**: Use test script
2. **UI changes**: Check browser console
3. **Database changes**: Use Prisma Studio
4. **Build validation**: Run `npm run build`

## Production Deployment Issues

### Vercel Deployment

Common issues:
- Environment variables not set
- Build timeouts
- API route errors

Solutions:
1. Add all environment variables in Vercel dashboard
2. Check build logs for errors
3. Test API routes individually

### Database Issues

- Ensure production database URL is correct
- Run migrations if schema changed
- Check database connection limits

This debugging guide should help you identify and resolve most common issues quickly!