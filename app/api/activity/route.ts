import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      childId,
      approvedVideoId,
      youtubeId,
      activityType,
      watchTimeSeconds = 0,
      videoPosition = 0,
      sessionId,
      videoTitle,
      channelName,
      videoDuration,
      completed = false,
      completionRate,
      deviceInfo,
      appVersion
    } = body;

    // Validate required fields
    if (!childId || !youtubeId || !activityType) {
      return NextResponse.json(
        { error: 'Missing required fields: childId, youtubeId, activityType' },
        { status: 400 }
      );
    }

    // Verify the child belongs to the authenticated user
    const child = await db.child.findFirst({
      where: {
        id: childId,
        parent: {
          clerkId: userId
        }
      }
    });

    if (!child) {
      return NextResponse.json({ error: 'Child not found or unauthorized' }, { status: 404 });
    }

    // Find or get the approved video
    let approvedVideo = null;
    if (approvedVideoId) {
      approvedVideo = await db.approvedVideo.findFirst({
        where: {
          id: approvedVideoId,
          childId: childId
        }
      });
    } else {
      // Try to find by youtubeId and childId
      approvedVideo = await db.approvedVideo.findFirst({
        where: {
          youtubeId: youtubeId,
          childId: childId
        }
      });
    }

    if (!approvedVideo) {
      return NextResponse.json({ error: 'Approved video not found' }, { status: 404 });
    }

    // Record the activity
    const activity = await db.videoActivity.create({
      data: {
        childId,
        approvedVideoId: approvedVideo.id,
        youtubeId,
        activityType,
        watchTimeSeconds,
        videoPosition,
        sessionId,
        videoTitle: videoTitle || approvedVideo.title,
        channelName: channelName || approvedVideo.channelName,
        videoDuration: videoDuration || approvedVideo.duration,
        completed,
        completionRate,
        deviceInfo,
        appVersion
      }
    });

    // Update the approved video's watched status if completed
    if (activityType === 'COMPLETE' || completed) {
      await db.approvedVideo.update({
        where: { id: approvedVideo.id },
        data: {
          watched: true,
          watchedAt: new Date()
        }
      });
    }

    // Update session statistics if sessionId provided
    if (sessionId) {
      const session = await db.appSession.findUnique({
        where: { sessionId }
      });

      if (session) {
        const updateData: any = {};
        
        if (activityType === 'CLICK') {
          updateData.videosClicked = { increment: 1 };
        } else if (activityType === 'PLAY') {
          updateData.videosWatched = { increment: 1 };
        }
        
        if (watchTimeSeconds > 0) {
          updateData.totalWatchTime = { increment: watchTimeSeconds };
        }

        if (Object.keys(updateData).length > 0) {
          await db.appSession.update({
            where: { sessionId },
            data: updateData
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      activityId: activity.id,
      message: 'Activity recorded successfully'
    });

  } catch (error) {
    console.error('Error recording activity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Verify the child belongs to the authenticated user
    const child = await db.child.findFirst({
      where: {
        id: childId || undefined,
        parent: {
          clerkId: userId
        }
      }
    });

    if (!child && childId) {
      return NextResponse.json({ error: 'Child not found or unauthorized' }, { status: 404 });
    }

    // Get activities for specific child or all children of the parent
    const whereClause = childId ? { childId } : {
      child: {
        parent: {
          clerkId: userId
        }
      }
    };

    const activities = await db.videoActivity.findMany({
      where: whereClause,
      include: {
        child: {
          select: {
            id: true,
            name: true
          }
        },
        approvedVideo: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
            channelName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    const totalCount = await db.videoActivity.count({
      where: whereClause
    });

    return NextResponse.json({
      activities,
      totalCount,
      limit,
      offset,
      hasMore: offset + limit < totalCount
    });

  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}