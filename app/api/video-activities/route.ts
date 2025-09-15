import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    console.log('📊 Video Activity API: Recording activity');
    
    const { userId } = await auth();
    if (!userId) {
      console.log('❌ No userId found in auth');
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

    console.log('📊 Recording activity:', {
      childId,
      youtubeId,
      activityType,
      watchTimeSeconds,
      videoPosition
    });

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
      console.log('❌ Child not found or unauthorized');
      return NextResponse.json({ error: 'Child not found or unauthorized' }, { status: 404 });
    }

    // If approvedVideoId is provided, verify it exists and belongs to this child
    if (approvedVideoId) {
      const approvedVideo = await db.approvedVideo.findFirst({
        where: {
          id: approvedVideoId,
          childId: childId
        }
      });

      if (!approvedVideo) {
        console.log('⚠️ Approved video not found, proceeding without link');
        // Don't fail the request, just proceed without the approved video link
      }
    }

    // Create the video activity record
    const videoActivity = await db.videoActivity.create({
      data: {
        childId,
        approvedVideoId: approvedVideoId || undefined,
        youtubeId,
        activityType: activityType as any, // ActivityType enum
        watchTimeSeconds: Math.max(0, watchTimeSeconds || 0),
        videoPosition: Math.max(0, videoPosition || 0),
        sessionId,
        videoTitle,
        channelName,
        videoDuration,
        completed: completed || false,
        completionRate: completionRate ? Math.min(100, Math.max(0, completionRate)) : null,
        deviceInfo,
        appVersion
      }
    });

    console.log('✅ Video activity recorded:', videoActivity.id);

    // If this is a completion activity, mark the approved video as watched
    if (activityType === 'COMPLETE' && approvedVideoId) {
      try {
        await db.approvedVideo.update({
          where: { id: approvedVideoId },
          data: { 
            watched: true,
            watchedAt: new Date()
          }
        });
        console.log('✅ Approved video marked as watched');
      } catch (error) {
        console.log('⚠️ Could not update approved video status:', error);
        // Don't fail the request for this
      }
    }

    return NextResponse.json({
      success: true,
      activityId: videoActivity.id,
      message: 'Video activity recorded successfully'
    });

  } catch (error) {
    console.error('❌ Video Activity API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to record video activity',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve video activities (for debugging/analytics)
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get children belonging to this user
    const whereClause: any = {
      child: {
        parent: {
          clerkId: userId
        }
      }
    };

    if (childId) {
      whereClause.childId = childId;
    }

    const activities = await db.videoActivity.findMany({
      where: whereClause,
      include: {
        child: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    return NextResponse.json({
      activities: activities.map(activity => ({
        id: activity.id,
        childId: activity.childId,
        childName: activity.child.name,
        youtubeId: activity.youtubeId,
        activityType: activity.activityType,
        watchTimeSeconds: activity.watchTimeSeconds,
        videoPosition: activity.videoPosition,
        videoTitle: activity.videoTitle,
        channelName: activity.channelName,
        completed: activity.completed,
        completionRate: activity.completionRate,
        createdAt: activity.createdAt.toISOString()
      }))
    });

  } catch (error) {
    console.error('❌ Get activities error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}