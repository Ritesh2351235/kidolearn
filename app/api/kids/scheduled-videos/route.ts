import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Function to handle carrying over unwatched videos from previous days
async function handleVideoCarryover(childId: string, currentDate: string) {
  const today = new Date(currentDate);

  console.log(`🔄 Checking carryover for child ${childId} on ${currentDate}`);

  // Find unwatched scheduled videos from previous days
  const unwatchedVideos = await db.scheduledVideo.findMany({
    where: {
      childId,
      scheduledDate: {
        lt: today,
      },
      isActive: true,
      isWatched: false,
    },
    include: {
      approvedVideo: {
        select: {
          title: true,
        },
      },
    },
  });

  console.log(`📋 Found ${unwatchedVideos.length} unwatched videos from previous days for child ${childId}`);

  let carriedOverCount = 0;

  // Carry over each unwatched video to today
  for (const video of unwatchedVideos) {
    // Check if this video is already scheduled for today
    const existingToday = await db.scheduledVideo.findFirst({
      where: {
        childId,
        approvedVideoId: video.approvedVideoId,
        scheduledDate: today,
      },
    });

    if (!existingToday) {
      // Create a new entry for today with carryover flag
      await db.scheduledVideo.create({
        data: {
          childId: video.childId,
          approvedVideoId: video.approvedVideoId,
          scheduledDate: today,
          originalDate: video.originalDate,
          carriedOver: true,
        },
      });

      console.log(`↪ Carried over "${video.approvedVideo.title}" to ${currentDate}`);
      carriedOverCount++;
    }

    // Mark the old entry as inactive
    await db.scheduledVideo.update({
      where: { id: video.id },
      data: { isActive: false },
    });
  }

  console.log(`✅ Carryover complete for child ${childId}: ${carriedOverCount} videos carried over to ${currentDate}`);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');
    const currentDate = searchParams.get('date') || new Date().toISOString().split('T')[0];

    if (!childId) {
      return NextResponse.json(
        { error: "Child ID is required" },
        { status: 400 }
      );
    }

    console.log(`🎬 Fetching scheduled videos for child ${childId} on ${currentDate}`);

    // First, handle carryover logic - move unwatched videos from previous days to today
    await handleVideoCarryover(childId, currentDate);

    // Get all active scheduled videos for today (including carried over ones)
    const scheduledVideos = await db.scheduledVideo.findMany({
      where: {
        childId,
        scheduledDate: new Date(currentDate),
        isActive: true,
        isWatched: false, // Only show unwatched videos
      },
      include: {
        approvedVideo: {
          select: {
            id: true,
            youtubeId: true,
            title: true,
            description: true,
            thumbnail: true,
            channelName: true,
            duration: true,
            summary: true,
          },
        },
      },
      orderBy: [
        { carriedOver: 'asc' }, // Show new videos first, then carried over
        { createdAt: 'asc' },
      ],
    });

    // Transform for mobile app
    const videosForKids = scheduledVideos.map(schedule => ({
      id: schedule.approvedVideo.youtubeId,
      title: schedule.approvedVideo.title,
      description: schedule.approvedVideo.description || '',
      thumbnail: schedule.approvedVideo.thumbnail,
      highResThumbnail: schedule.approvedVideo.thumbnail,
      channelName: schedule.approvedVideo.channelName,
      duration: schedule.approvedVideo.duration || '0:00',
      publishedAt: schedule.createdAt.toISOString(),
      viewCount: '0',
      category: 'scheduled',
      summary: schedule.approvedVideo.summary,
      isScheduled: true,
      carriedOver: schedule.carriedOver,
      scheduledVideoId: schedule.id, // Include the scheduled video ID for tracking
    }));

    console.log(`✅ Found ${videosForKids.length} scheduled videos for child ${childId}`);

    return NextResponse.json({
      videos: videosForKids,
      total: videosForKids.length,
      currentDate,
    });
  } catch (error) {
    console.error("Error fetching scheduled videos for kids:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}