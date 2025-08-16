import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// This endpoint can be called by a cron job or similar to handle end-of-day carryover
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date } = body; // Date to process carryover for (format: YYYY-MM-DD)
    
    if (!date) {
      return NextResponse.json(
        { error: "Date is required" },
        { status: 400 }
      );
    }

    const processDate = new Date(date);
    const nextDay = new Date(processDate);
    nextDay.setDate(nextDay.getDate() + 1);

    console.log(`🔄 Processing end-of-day carryover for ${date} to ${nextDay.toISOString().split('T')[0]}`);

    // Find all unwatched scheduled videos for the specified date
    const unwatchedVideos = await db.scheduledVideo.findMany({
      where: {
        scheduledDate: processDate,
        isActive: true,
        isWatched: false,
      },
      include: {
        child: {
          select: {
            id: true,
            name: true,
          },
        },
        approvedVideo: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    console.log(`📋 Found ${unwatchedVideos.length} unwatched videos to carry over`);

    let carriedOverCount = 0;

    // Process each unwatched video
    for (const video of unwatchedVideos) {
      // Check if this video is already scheduled for the next day
      const existingNextDay = await db.scheduledVideo.findFirst({
        where: {
          childId: video.childId,
          approvedVideoId: video.approvedVideoId,
          scheduledDate: nextDay,
        },
      });

      if (!existingNextDay) {
        // Create a new entry for the next day with carryover flag
        await db.scheduledVideo.create({
          data: {
            childId: video.childId,
            approvedVideoId: video.approvedVideoId,
            scheduledDate: nextDay,
            originalDate: video.originalDate,
            carriedOver: true,
          },
        });

        console.log(`↪ Carried over "${video.approvedVideo.title}" for ${video.child.name} to ${nextDay.toISOString().split('T')[0]}`);
        carriedOverCount++;
      }

      // Mark the current day's entry as inactive (but keep it for history)
      await db.scheduledVideo.update({
        where: { id: video.id },
        data: { isActive: false },
      });
    }

    console.log(`✅ Carryover complete: ${carriedOverCount} videos carried over to ${nextDay.toISOString().split('T')[0]}`);

    return NextResponse.json({
      success: true,
      date: date,
      nextDate: nextDay.toISOString().split('T')[0],
      unwatchedVideosFound: unwatchedVideos.length,
      videosCarriedOver: carriedOverCount,
      message: `Successfully processed carryover for ${date}`,
    });
  } catch (error) {
    console.error("Error processing carryover:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint to check what would be carried over (for testing)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    
    const processDate = new Date(date);

    // Find all unwatched scheduled videos for the specified date
    const unwatchedVideos = await db.scheduledVideo.findMany({
      where: {
        scheduledDate: processDate,
        isActive: true,
        isWatched: false,
      },
      include: {
        child: {
          select: {
            id: true,
            name: true,
          },
        },
        approvedVideo: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json({
      date: date,
      unwatchedVideos: unwatchedVideos.map(video => ({
        childName: video.child.name,
        videoTitle: video.approvedVideo.title,
        originalDate: video.originalDate.toISOString().split('T')[0],
        carriedOver: video.carriedOver,
      })),
      count: unwatchedVideos.length,
    });
  } catch (error) {
    console.error("Error checking carryover:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}