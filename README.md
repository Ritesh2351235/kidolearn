# Kids Screen Curator & Planner MVP

Transform unstructured YouTube viewing into safe, educational experiences for children.

## Features

- **Parent Dashboard**: Complete control over children's content
- **AI-Powered Curation**: Smart video recommendations based on age and interests
- **Content Approval System**: Review and approve videos before children can watch
- **Educational Summaries**: AI-generated summaries highlighting learning outcomes
- **Analytics Dashboard**: Track viewing patterns and educational progress
- **Child Profile Management**: Customize interests and age-appropriate content

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Authentication**: Clerk for secure parent login
- **Database**: PostgreSQL with Prisma ORM (Neon.tech compatible)
- **APIs**: YouTube Data API v3 and OpenAI GPT for summaries
- **Deployment**: Vercel-ready serverless architecture

## Setup Instructions

### 1. Environment Variables

Copy `.env.example` to `.env.local` and fill in your API keys:

```bash
cp .env.example .env.local
```

Required API keys:
- **Clerk**: Get from [clerk.com](https://clerk.com)
- **Neon Database**: Create at [neon.tech](https://neon.tech)
- **OpenAI**: Get from [platform.openai.com](https://platform.openai.com)
- **YouTube**: Get from [Google Cloud Console](https://console.cloud.google.com)

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## API Keys Setup Guide

### Clerk Authentication
1. Create account at [clerk.com](https://clerk.com)
2. Create new application
3. Copy publishable and secret keys to `.env.local`

### Neon PostgreSQL Database
1. Create account at [neon.tech](https://neon.tech)
2. Create new database
3. Copy connection string to `DATABASE_URL` in `.env.local`

### OpenAI API
1. Create account at [platform.openai.com](https://platform.openai.com)
2. Generate API key
3. Add to `OPENAI_API_KEY` in `.env.local`

### YouTube Data API v3
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable YouTube Data API v3
4. Create credentials (API key)
5. Add to `YOUTUBE_API_KEY` in `.env.local`

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Protected dashboard pages
│   ├── sign-in/          # Authentication pages
│   └── api/              # API routes
├── components/            # Reusable components
│   ├── dashboard/        # Dashboard-specific components
│   └── ui/               # UI components
├── lib/                   # Utility functions
│   ├── db.ts             # Database connection
│   ├── actions.ts        # Server actions
│   ├── youtube.ts        # YouTube API integration
│   └── openai.ts         # OpenAI API integration
└── prisma/               # Database schema
```

## Key Features Explained

### 1. Child Profile Management
- Add children with age and interests
- Customize interests for better recommendations
- Manage multiple children from single parent account

### 2. Video Recommendations
- AI-powered YouTube search based on child's interests and age
- Safe search enabled for child-appropriate content
- Educational focus with learning outcome summaries

### 3. Approval System
- Parents review all videos before approval
- AI-generated educational summaries help with decisions
- One-click approval adds videos to child's approved list

### 4. Analytics Dashboard
- Track approved vs watched videos
- Monitor most popular interests
- View recent activity and engagement rates

## Deployment

### Vercel Deployment
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Environment Variables for Production
Ensure all environment variables from `.env.local` are added to your deployment platform.

## Database Schema

The application uses three main models:
- **Parent**: Clerk user information
- **Child**: Child profiles with interests
- **ApprovedVideo**: Videos approved for children

## Contributing

This is an MVP. Future enhancements could include:
- Mobile app for children
- Payment integration
- Advanced analytics
- Parental controls
- Content categories
- Viewing time limits

## License

Private MVP - All rights reserved.
