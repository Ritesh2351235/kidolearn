# 🎓 KidoLearn - Smart Video Learning Platform

> Transform unstructured YouTube viewing into safe, educational experiences for children with AI-powered content curation and smart scheduling.

## Live here - https://kidscurator.vercel.app/

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Mobile App](#mobile-app)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## 🌟 Overview

KidoLearn is a comprehensive platform that revolutionizes how children consume educational content online. By combining AI-powered content curation, intelligent scheduling, and robust parental controls, we create a safe and enriching digital learning environment.

### 🎯 Problem Statement

- Children spend hours on YouTube without proper educational value
- Parents struggle to find age-appropriate, quality content
- Lack of structured learning paths and progress tracking
- No effective way to schedule and limit screen time

### 💡 Solution

KidoLearn provides:
- **AI-Powered Curation**: Intelligent content filtering and recommendation
- **Smart Scheduling**: Date-based video scheduling with automatic carryover
- **Parental Dashboard**: Comprehensive analytics and content management
- **Mobile App**: Kid-friendly interface for safe content consumption
- **Progress Tracking**: Detailed analytics and learning insights

## ✨ Features

### 👨‍👩‍👧‍👦 For Parents
- **Content Discovery**: AI-powered video recommendations based on child's age and interests
- **Bulk Scheduling**: Schedule multiple videos for specific dates with one click
- **Analytics Dashboard**: Track viewing habits, learning progress, and engagement
- **Child Profiles**: Manage multiple children with age-appropriate content curation
- **Safety Controls**: Curated, safe content with no inappropriate material access

### 👶 For Kids
- **Scheduled Videos**: Access only videos scheduled by parents for today
- **Automatic Carryover**: Unwatched videos automatically move to the next day
- **Visual Badges**: Clear indicators for carried-over vs new content
- **Engaging Interface**: Kid-friendly design with colorful gradients and animations
- **Progress Tracking**: Visual feedback on completed content and achievements

### 🤖 AI-Powered Features
- **Content Analysis**: AI summarization of video content for educational value
- **Age-Appropriate Filtering**: Automatic content classification by age groups
- **Learning Path Generation**: Intelligent content sequencing for optimal learning
- **Engagement Analytics**: AI-driven insights into learning patterns and preferences

## 🛠 Technology Stack

### Frontend (Web Dashboard)
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Authentication**: Clerk
- **State Management**: React Hooks + Context

### Mobile App
- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: Expo Router
- **Authentication**: Clerk Expo
- **Styling**: React Native StyleSheet + Gradients

### Backend & APIs
- **Runtime**: Node.js
- **API Framework**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **External APIs**: 
  - YouTube Data API v3
  - OpenAI GPT-4 (for content analysis)
- **Authentication**: Clerk (JWT tokens)

### Database & Storage
- **Primary Database**: PostgreSQL
- **ORM**: Prisma
- **Schema Management**: Prisma Migrations
- **Data Validation**: Zod

### DevOps & Deployment
- **Platform**: Vercel (Web) + Expo (Mobile)
- **CI/CD**: GitHub Actions
- **Environment Management**: Vercel Environment Variables
- **Version Control**: Git with GitHub

## 🏗 Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Dashboard │    │   Mobile App    │    │   Admin Panel   │
│   (Next.js)     │    │   (React Native)│    │   (Future)      │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │      API Gateway          │
                    │   (Next.js API Routes)    │
                    └─────────────┬─────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
    ┌─────────▼─────────┐ ┌─────▼─────┐ ┌─────────▼─────────┐
    │   Authentication  │ │ Database  │ │   External APIs   │
    │     (Clerk)       │ │(PostgreSQL│ │ YouTube API, GPT-4│
    └───────────────────┘ │ + Prisma) │ └───────────────────┘
                          └───────────┘
```

## 📁 Project Structure

```
kidscurator/
├── 📱 Mobile App
│   └── kids-mobile/
│       ├── app/                    # Expo Router pages
│       │   ├── (tabs)/            # Tab navigation
│       │   ├── auth.tsx           # Authentication
│       │   ├── child-profiles.tsx # Profile selection
│       │   └── video-player.tsx   # Video playback
│       ├── components/            # Reusable components
│       ├── contexts/              # React contexts
│       ├── hooks/                 # Custom hooks
│       ├── lib/                   # Utilities & API client
│       └── constants/             # App constants
│
├── 🌐 Web Dashboard
│   ├── app/                       # Next.js App Router
│   │   ├── api/                   # API endpoints
│   │   │   ├── children/          # Child management
│   │   │   ├── recommendations/   # AI recommendations
│   │   │   ├── scheduled-videos/  # Video scheduling
│   │   │   ├── kids/              # Kids mobile APIs
│   │   │   └── videos/            # Video management
│   │   ├── dashboard/             # Protected dashboard
│   │   │   ├── analytics/         # Analytics pages
│   │   │   ├── approved/          # Approved videos
│   │   │   ├── children/          # Child management
│   │   │   ├── recommendations/   # Content discovery
│   │   │   └── schedule/          # Video scheduling
│   │   ├── sign-in/               # Authentication
│   │   └── sign-up/
│   ├── components/                # React components
│   │   ├── dashboard/             # Dashboard-specific
│   │   └── ui/                    # Reusable UI components
│   ├── lib/                       # Utilities & helpers
│   │   ├── actions.ts             # Server actions
│   │   ├── db.ts                  # Database client
│   │   ├── youtube.ts             # YouTube API client
│   │   └── utils.ts               # Helper functions
│   └── prisma/                    # Database
│       ├── schema.prisma          # Database schema
│       └── migrations/            # Schema migrations
│
├── 🎨 Shared Assets
│   ├── public/                    # Static assets
│   └── styles/                    # Global styles
│
└── 📄 Configuration
    ├── package.json               # Dependencies
    ├── tsconfig.json             # TypeScript config
    ├── tailwind.config.ts        # Tailwind CSS config
    ├── next.config.js            # Next.js config
    └── .env.local                # Environment variables
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- YouTube Data API key
- OpenAI API key (optional, for AI features)
- Clerk account for authentication

### 1. Clone the Repository
```bash
git clone [your-repo-url]
cd kidscurator
```

### 2. Install Dependencies
```bash
# Install web dashboard dependencies
npm install

# Install mobile app dependencies
cd kids-mobile
npm install
cd ..
```

### 3. Environment Configuration

#### Web Dashboard (.env.local)
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/kidolearn"

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# External APIs
YOUTUBE_API_KEY="your_youtube_api_key"
OPENAI_API_KEY="your_openai_api_key"

# App URL
NEXTAUTH_URL="http://localhost:3000"
```

#### Mobile App (kids-mobile/.env)
```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
EXPO_PUBLIC_API_URL="http://172.16.22.127:3000"
```

### 4. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# (Optional) Seed database
npx prisma db seed
```

### 5. Start Development Servers

#### Web Dashboard
```bash
npm run dev
# Runs on http://localhost:3000
```

#### Mobile App
```bash
cd kids-mobile
npm start
# Opens Expo development tools
```

## 🎮 Usage

### Getting Started
1. **Sign Up**: Create a parent account at `/sign-up`
2. **Add Children**: Create profiles for your children with age and interests
3. **Discover Content**: Browse AI-recommended videos in the recommendations tab
4. **Approve & Schedule**: Approve videos and schedule them for specific dates
5. **Monitor Progress**: Track your children's viewing habits in analytics

### Parent Workflow
1. **Content Discovery** → **Content Approval** → **Scheduling** → **Analytics**

### Child Experience
1. **Profile Selection** → **View Scheduled Videos** → **Watch Content** → **Progress Tracking**

## 📚 API Documentation

### Core Endpoints

#### Children Management
- `GET /api/children` - Get all children for authenticated parent
- `POST /api/children` - Create new child profile
- `PUT /api/children/[id]` - Update child profile
- `DELETE /api/children/[id]` - Delete child profile

#### Video Recommendations
- `GET /api/recommendations?childId={id}` - Get AI-powered recommendations
- `POST /api/videos` - Approve a video for child

#### Video Scheduling
- `GET /api/scheduled-videos?childId={id}` - Get scheduled videos
- `POST /api/scheduled-videos` - Schedule multiple videos
- `PUT /api/scheduled-videos/[id]` - Update scheduled video
- `DELETE /api/scheduled-videos/[id]` - Remove scheduled video

#### Mobile APIs
- `GET /api/kids/scheduled-videos?childId={id}&date={date}` - Get today's scheduled videos
- `POST /api/kids/scheduled-videos/watched` - Mark video as watched

#### Analytics
- `GET /api/parent/analytics?childId={id}` - Get viewing analytics
- `POST /api/activity` - Track video interactions

### Authentication
All API endpoints require Clerk JWT authentication via `Authorization: Bearer {token}` header.

## 🗃 Database Schema

### Core Models

#### Parent
```prisma
model Parent {
  id          String    @id @default(cuid())
  clerkUserId String    @unique
  email       String    @unique
  children    Child[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

#### Child
```prisma
model Child {
  id               String           @id @default(cuid())
  parentId         String
  name             String
  birthday         DateTime
  interests        String[]
  approvedVideos   ApprovedVideo[]
  scheduledVideos  ScheduledVideo[]
  activities       Activity[]
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt
}
```

#### ScheduledVideo (Smart Scheduling)
```prisma
model ScheduledVideo {
  id               String        @id @default(cuid())
  childId          String
  approvedVideoId  String
  scheduledDate    DateTime
  originalDate     DateTime      @default(now())
  isWatched        Boolean       @default(false)
  watchedAt        DateTime?
  isActive         Boolean       @default(true)
  carriedOver      Boolean       @default(false)
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt
}
```

## 📱 Mobile App

### Key Features
- **Profile Selection**: Kids choose their profile on app launch
- **Scheduled Content**: Only shows videos scheduled for today
- **Automatic Carryover**: Unwatched videos appear next day with visual indicators
- **Engaging UI**: Colorful gradients, animations, and kid-friendly design
- **Activity Tracking**: Comprehensive interaction logging

### Architecture
- **Expo Router**: File-based navigation
- **Context API**: Global state management
- **API Integration**: Real-time sync with web dashboard
- **Offline Support**: Graceful fallbacks when network unavailable

### Development Commands
```bash
cd kids-mobile

# Start development
npm start

# Run on specific platform
npm run ios
npm run android

# Get development IP
npm run get-ip

# Reset project
npm run reset-project
```

## 🚀 Deployment

### Web Dashboard (Vercel)
```bash
# Build and deploy
npm run build
vercel --prod
```

### Mobile App (Expo)
```bash
cd kids-mobile

# Build for production
expo build:android
expo build:ios

# Publish update
expo publish
```

### Environment Variables
Ensure all production environment variables are configured in Vercel dashboard.

## 🔒 Security & Privacy

### Data Protection
- **Authentication**: Clerk-managed user sessions
- **API Security**: JWT token validation
- **Input Validation**: Zod schema validation
- **SQL Injection Prevention**: Prisma ORM parameterized queries

### Content Safety
- **YouTube API**: Only fetches from safe, educational channels
- **Content Filtering**: AI-powered inappropriate content detection
- **Parental Controls**: All content must be parent-approved

### Privacy
- **Data Minimization**: Only collect necessary user data
- **Local Storage**: Sensitive data stored securely
- **Third-party APIs**: Minimal data sharing with external services

## 🏆 Hackathon Achievements

### Technical Innovation
- ✅ AI-powered content curation
- ✅ Smart date-based scheduling with carryover
- ✅ Real-time analytics dashboard
- ✅ Cross-platform mobile app

### User Experience
- ✅ Intuitive parent dashboard
- ✅ Engaging kid-friendly mobile interface
- ✅ Comprehensive onboarding flow
- ✅ Responsive design across devices

### Code Quality
- ✅ TypeScript throughout
- ✅ Comprehensive error handling
- ✅ Database schema optimization
- ✅ API rate limiting and caching

## 🔮 Future Enhancements

- [ ] Real-time notifications
- [ ] Offline video downloading
- [ ] Advanced learning analytics
- [ ] Multi-language support
- [ ] Gamification features
- [ ] Social learning features
- [ ] Voice commands for kids
- [ ] AR/VR content integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript strict mode
- Use Prettier for code formatting
- Write meaningful commit messages
- Add JSDoc comments for complex functions
- Ensure mobile responsiveness

## 📞 Support

For technical support or questions:
- **Email**: [your-email@domain.com]
- **GitHub Issues**: [Repository Issues]
- **Discord**: [Your Discord Server]

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Made with ❤️ for the next generation of learners**

*KidoLearn - Where Learning Meets Fun!*
