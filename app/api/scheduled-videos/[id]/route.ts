import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: scheduleId } = await params;

    if (!scheduleId) {
      return NextResponse.json(
        { error: "Schedule ID is required" },
        { status: 400 }
      );
    }

    // Get the parent
    const parent = await db.parent.findUnique({
      where: { clerkId: userId },
    });

    if (!parent) {
      return NextResponse.json(
        { error: "Parent not found" },
        { status: 404 }
      );
    }

    // Verify the scheduled video exists and belongs to this parent's child
    const scheduledVideo = await db.scheduledVideo.findFirst({
      where: {
        id: scheduleId,
        child: {
          parentId: parent.id,
        },
      },
    });

    if (!scheduledVideo) {
      return NextResponse.json(
        { error: "Scheduled video not found" },
        { status: 404 }
      );
    }

    // Delete the scheduled video
    await db.scheduledVideo.delete({
      where: {
        id: scheduleId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Scheduled video removed successfully",
    });
  } catch (error) {
    console.error("Error deleting scheduled video:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}