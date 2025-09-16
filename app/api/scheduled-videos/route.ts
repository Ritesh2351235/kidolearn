import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');
    const date = searchParams.get('date');

    console.log('📅 Scheduled videos API called with:', { childId, date });

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

    // Build where clause
    const whereClause: any = {
      child: {
        parentId: parent.id,
      },
      isActive: true,
    };

    // Filter by specific child if provided
    if (childId) {
      // Verify the child belongs to this parent
      const child = await db.child.findFirst({
        where: {
          id: childId,
          parentId: parent.id,
        },
      });

      if (!child) {
        return NextResponse.json(
          { error: "Child not found or unauthorized" },
          { status: 404 }
        );
      }

      whereClause.childId = childId;
      console.log('📅 Filtering scheduled videos for child:', child.name);
    }

    // Filter by date if provided
    if (date) {
      const targetDate = new Date(date);
      whereClause.scheduledDate = {
        gte: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()),
        lt: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1),
      };
      console.log('📅 Filtering scheduled videos for date:', date);
    }

    // Get scheduled videos with filters
    const scheduledVideos = await db.scheduledVideo.findMany({
      where: whereClause,
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
            youtubeId: true,
            title: true,
            description: true,
            thumbnail: true,
            channelName: true,
            duration: true,
          },
        },
      },
      orderBy: [
        { scheduledDate: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    // Transform the data for the frontend
    const transformedVideos = scheduledVideos.map(schedule => ({
      id: schedule.id,
      title: schedule.approvedVideo.title,
      thumbnail: schedule.approvedVideo.thumbnail,
      duration: schedule.approvedVideo.duration || "0:00",
      scheduledDate: schedule.scheduledDate.toISOString().split('T')[0],
      childrenIds: [schedule.childId],
      childrenNames: [schedule.child.name],
      youtubeId: schedule.approvedVideo.youtubeId,
      channelName: schedule.approvedVideo.channelName,
      isWatched: schedule.isWatched,
      carriedOver: schedule.carriedOver,
    }));

    console.log(`📅 Returning ${transformedVideos.length} scheduled videos${childId ? ` for child ${childId}` : ' for all children'}`);

    return NextResponse.json({
      scheduledVideos: transformedVideos,
    });
  } catch (error) {
    console.error("Error fetching scheduled videos:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { approvedVideoIds, childrenIds, scheduledDate } = body;

    if (!approvedVideoIds || !Array.isArray(approvedVideoIds) || approvedVideoIds.length === 0 || 
        !childrenIds || !Array.isArray(childrenIds) || childrenIds.length === 0 || !scheduledDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    // Verify all approved videos exist and belong to the parent's children
    const approvedVideos = await db.approvedVideo.findMany({
      where: {
        id: { in: approvedVideoIds },
        child: {
          parentId: parent.id,
        },
      },
    });

    if (approvedVideos.length !== approvedVideoIds.length) {
      return NextResponse.json(
        { error: "One or more approved videos not found" },
        { status: 404 }
      );
    }

    // Verify all children belong to this parent
    const children = await db.child.findMany({
      where: {
        id: { in: childrenIds },
        parentId: parent.id,
      },
    });

    if (children.length !== childrenIds.length) {
      return NextResponse.json(
        { error: "One or more children not found" },
        { status: 404 }
      );
    }

    // Create scheduled videos for each combination of child and video
    const scheduledVideos = [];
    
    for (const childId of childrenIds) {
      for (const approvedVideoId of approvedVideoIds) {
        const scheduledVideo = await db.scheduledVideo.create({
          data: {
            childId,
            approvedVideoId,
            scheduledDate: new Date(scheduledDate),
            originalDate: new Date(scheduledDate),
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
                youtubeId: true,
                title: true,
                description: true,
                thumbnail: true,
                channelName: true,
                duration: true,
              },
            },
          },
        });
        scheduledVideos.push(scheduledVideo);
      }
    }

    return NextResponse.json({
      success: true,
      scheduledVideos,
    });
  } catch (error) {
    console.error("Error creating scheduled videos:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}