-- CreateEnum
CREATE TYPE "public"."ActivityType" AS ENUM ('CLICK', 'PLAY', 'PAUSE', 'RESUME', 'SEEK', 'COMPLETE', 'EXIT', 'SHARE', 'LIKE');

-- CreateTable
CREATE TABLE "public"."parents" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."children" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "birthday" TIMESTAMP(3) NOT NULL,
    "interests" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "children_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."approved_videos" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "youtubeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT NOT NULL,
    "channelName" TEXT NOT NULL,
    "duration" TEXT,
    "summary" TEXT NOT NULL,
    "watched" BOOLEAN NOT NULL DEFAULT false,
    "watchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approved_videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."video_activities" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "approvedVideoId" TEXT NOT NULL,
    "youtubeId" TEXT NOT NULL,
    "activityType" "public"."ActivityType" NOT NULL,
    "watchTimeSeconds" INTEGER NOT NULL DEFAULT 0,
    "videoPosition" INTEGER NOT NULL DEFAULT 0,
    "sessionId" TEXT,
    "videoTitle" TEXT NOT NULL,
    "channelName" TEXT NOT NULL,
    "videoDuration" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completionRate" DOUBLE PRECISION,
    "deviceInfo" TEXT,
    "appVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "video_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."app_sessions" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "duration" INTEGER,
    "videosClicked" INTEGER NOT NULL DEFAULT 0,
    "videosWatched" INTEGER NOT NULL DEFAULT 0,
    "totalWatchTime" INTEGER NOT NULL DEFAULT 0,
    "deviceInfo" TEXT,
    "appVersion" TEXT,
    "platform" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."child_activities" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "sessionsCount" INTEGER NOT NULL DEFAULT 0,
    "totalSessionTime" INTEGER NOT NULL DEFAULT 0,
    "videosClickedCount" INTEGER NOT NULL DEFAULT 0,
    "videosWatchedCount" INTEGER NOT NULL DEFAULT 0,
    "totalWatchTime" INTEGER NOT NULL DEFAULT 0,
    "uniqueVideosWatched" INTEGER NOT NULL DEFAULT 0,
    "averageWatchTime" DOUBLE PRECISION,
    "completionRate" DOUBLE PRECISION,
    "topChannels" TEXT[],
    "topCategories" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "child_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "parents_clerkId_key" ON "public"."parents"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "parents_email_key" ON "public"."parents"("email");

-- CreateIndex
CREATE UNIQUE INDEX "approved_videos_childId_youtubeId_key" ON "public"."approved_videos"("childId", "youtubeId");

-- CreateIndex
CREATE INDEX "video_activities_childId_createdAt_idx" ON "public"."video_activities"("childId", "createdAt");

-- CreateIndex
CREATE INDEX "video_activities_youtubeId_createdAt_idx" ON "public"."video_activities"("youtubeId", "createdAt");

-- CreateIndex
CREATE INDEX "video_activities_activityType_idx" ON "public"."video_activities"("activityType");

-- CreateIndex
CREATE UNIQUE INDEX "app_sessions_sessionId_key" ON "public"."app_sessions"("sessionId");

-- CreateIndex
CREATE INDEX "app_sessions_childId_startTime_idx" ON "public"."app_sessions"("childId", "startTime");

-- CreateIndex
CREATE INDEX "child_activities_childId_date_idx" ON "public"."child_activities"("childId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "child_activities_childId_date_key" ON "public"."child_activities"("childId", "date");

-- AddForeignKey
ALTER TABLE "public"."children" ADD CONSTRAINT "children_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."approved_videos" ADD CONSTRAINT "approved_videos_childId_fkey" FOREIGN KEY ("childId") REFERENCES "public"."children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."video_activities" ADD CONSTRAINT "video_activities_childId_fkey" FOREIGN KEY ("childId") REFERENCES "public"."children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."video_activities" ADD CONSTRAINT "video_activities_approvedVideoId_fkey" FOREIGN KEY ("approvedVideoId") REFERENCES "public"."approved_videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."app_sessions" ADD CONSTRAINT "app_sessions_childId_fkey" FOREIGN KEY ("childId") REFERENCES "public"."children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."child_activities" ADD CONSTRAINT "child_activities_childId_fkey" FOREIGN KEY ("childId") REFERENCES "public"."children"("id") ON DELETE CASCADE ON UPDATE CASCADE;
