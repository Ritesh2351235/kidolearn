import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scheduledVideoId, childId } = body;

    if (!scheduledVideoId || !childId) {
      return NextResponse.json(
        { error: "Scheduled video ID and child ID are required" },
        { status: 400 }
      );
    }

    console.log(`📺 Marking scheduled video ${scheduledVideoId} as watched for child ${childId}`);

    // Update the scheduled video as watched
    const updatedScheduledVideo = await db.scheduledVideo.update({
      where: {
        id: scheduledVideoId,
        childId: childId, // Ensure the child owns this scheduled video
      },
      data: {
        isWatched: true,
        watchedAt: new Date(),
      },
    });

    console.log(`✅ Scheduled video marked as watched:`, updatedScheduledVideo.id);

    return NextResponse.json({
      success: true,
      message: "Scheduled video marked as watched",
    });
  } catch (error) {
    console.error("Error marking scheduled video as watched:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}