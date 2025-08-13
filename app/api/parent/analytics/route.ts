import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');
    const days = parseInt(searchParams.get('days') || '7'); // Default to 7 days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Verify the child belongs to the authenticated user (if childId provided)
    let children = [];
    if (childId) {
      const child = await prisma.child.findFirst({
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
      children = [child];
    } else {
      // Get all children for the parent
      children = await prisma.child.findMany({
        where: {
          parent: {
            clerkId: userId
          }
        }
      });
    }

    const childIds = children.map(c => c.id);

    // Get activity overview
    const totalActivities = await prisma.videoActivity.count({
      where: {
        childId: { in: childIds },
        createdAt: { gte: startDate }
      }
    });

    const totalSessions = await prisma.appSession.count({
      where: {
        childId: { in: childIds },
        startTime: { gte: startDate }
      }
    });

    // Get watch time statistics
    const watchTimeStats = await prisma.videoActivity.aggregate({
      where: {
        childId: { in: childIds },
        createdAt: { gte: startDate }
      },
      _sum: {
        watchTimeSeconds: true
      },
      _avg: {
        completionRate: true
      }
    });

    // Get unique videos watched
    const uniqueVideosWatched = await prisma.videoActivity.groupBy({
      by: ['youtubeId'],
      where: {
        childId: { in: childIds },
        createdAt: { gte: startDate },
        activityType: { in: ['PLAY', 'COMPLETE'] }
      }
    });

    // Get most watched videos
    const mostWatchedVideos = await prisma.videoActivity.groupBy({
      by: ['youtubeId', 'videoTitle', 'channelName'],
      where: {
        childId: { in: childIds },
        createdAt: { gte: startDate },
        activityType: { in: ['PLAY', 'COMPLETE'] }
      },
      _count: {
        id: true
      },
      _sum: {
        watchTimeSeconds: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    });

    // Get daily activity breakdown
    const dailyActivity = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as activities_count,
        SUM(watch_time_seconds) as total_watch_time,
        COUNT(DISTINCT youtube_id) as unique_videos
      FROM video_activities 
      WHERE child_id = ANY(${childIds}) 
        AND created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    // Get top channels
    const topChannels = await prisma.videoActivity.groupBy({
      by: ['channelName'],
      where: {
        childId: { in: childIds },
        createdAt: { gte: startDate },
        activityType: { in: ['PLAY', 'COMPLETE'] }
      },
      _count: {
        id: true
      },
      _sum: {
        watchTimeSeconds: true
      },
      orderBy: {
        _sum: {
          watchTimeSeconds: 'desc'
        }
      },
      take: 5
    });

    // Get completion rates by activity type
    const activityBreakdown = await prisma.videoActivity.groupBy({
      by: ['activityType'],
      where: {
        childId: { in: childIds },
        createdAt: { gte: startDate }
      },
      _count: {
        id: true
      }
    });

    // Get session statistics
    const sessionStats = await prisma.appSession.aggregate({
      where: {
        childId: { in: childIds },
        startTime: { gte: startDate },
        duration: { not: null }
      },
      _sum: {
        duration: true,
        totalWatchTime: true
      },
      _avg: {
        duration: true,
        totalWatchTime: true
      }
    });

    return NextResponse.json({
      overview: {
        totalActivities,
        totalSessions,
        totalWatchTimeSeconds: watchTimeStats._sum.watchTimeSeconds || 0,
        averageCompletionRate: Math.round((watchTimeStats._avg.completionRate || 0) * 100) / 100,
        uniqueVideosWatched: uniqueVideosWatched.length,
        totalSessionTimeSeconds: sessionStats._sum.duration || 0,
        averageSessionTimeSeconds: Math.round(sessionStats._avg.duration || 0)
      },
      mostWatchedVideos: mostWatchedVideos.map(video => ({
        youtubeId: video.youtubeId,
        title: video.videoTitle,
        channelName: video.channelName,
        watchCount: video._count.id,
        totalWatchTimeSeconds: video._sum.watchTimeSeconds || 0
      })),
      topChannels: topChannels.map(channel => ({
        name: channel.channelName,
        watchCount: channel._count.id,
        totalWatchTimeSeconds: channel._sum.watchTimeSeconds || 0
      })),
      dailyActivity,
      activityBreakdown: activityBreakdown.map(activity => ({
        type: activity.activityType,
        count: activity._count.id
      })),
      children: children.map(child => ({
        id: child.id,
        name: child.name,
        age: child.age
      })),
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
        days
      }
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}