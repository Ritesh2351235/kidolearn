import { ExpoRequest, ExpoResponse } from 'expo-router/server';
import { db } from '@/lib/db';

export async function GET(request: ExpoRequest): Promise<Response> {
  try {
    console.log('📅 Mobile API: Fetching scheduled videos');
    
    // Extract real user ID from JWT token (same as approved videos API)
    let userId: string | null = null;
    
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      
      try {
        const base64Payload = token.split('.')[1];
        if (base64Payload) {
          const payload = JSON.parse(atob(base64Payload));
          userId = payload.sub;
          console.log('✅ User authenticated for scheduled videos:', userId);
        }
      } catch (tokenError) {
        console.log('⚠️ Token decode failed for scheduled videos');
        return Response.json({ error: 'Invalid token' }, { status: 401 });
      }
    } else {
      console.log('⚠️ No auth header for scheduled videos');
      return Response.json({ error: 'Unauthorized - Missing token' }, { status: 401 });
    }
    
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const date = url.searchParams.get('date');
    const childId = url.searchParams.get('childId');

    // Find or create parent (same pattern as approved videos API)
    let parent = await db.parent.findUnique({
      where: { clerkId: userId },
      include: { children: true },
    });

    if (!parent) {
      const timestamp = Date.now();
      const uniqueEmail = `parent-${timestamp}@mobile.app`;
      
      try {
        parent = await db.parent.create({
          data: {
            clerkId: userId,
            email: uniqueEmail,
            name: 'Mobile Parent',
          },
          include: { children: true },
        });
        console.log('✅ Created new parent for scheduled videos');
      } catch (createError: any) {
        parent = await db.parent.findFirst({
          where: { clerkId: userId },
          include: { children: true },
        });
        
        if (!parent) {
          const randomId = Math.random().toString(36).substring(7);
          parent = await db.parent.create({
            data: {
              clerkId: userId,
              email: `mobile-${randomId}@temp.app`,
              name: 'Mobile Parent',
            },
            include: { children: true },
          });
        }
      }
    }

    // Get children IDs for this parent
    const childrenIds = parent.children.map(child => child.id);
    console.log('👶 Children IDs for scheduled videos:', childrenIds);
    
    if (childrenIds.length === 0) {
      console.log('⚠️ No children found for parent, returning empty array');
      return Response.json({
        scheduledVideos: [],
        total: 0
      });
    }
    
    // Build where clause for scheduled videos
    const whereClause: any = {
      childId: {
        in: childrenIds
      },
      isActive: true // Only active scheduled videos
    };
    
    // Filter by specific child if requested
    if (childId) {
      if (!childrenIds.includes(childId)) {
        return Response.json({ error: 'Child not found or not owned by parent' }, { status: 404 });
      }
      whereClause.childId = childId;
    }
    
    // Filter by date if requested
    if (date) {
      const targetDate = new Date(date);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      whereClause.scheduledDate = {
        gte: targetDate,
        lt: nextDay
      };
    }
    
    console.log('🔍 Fetching scheduled videos with where clause:', JSON.stringify(whereClause));
    
    // Query scheduled videos with proper relationships
    const scheduledVideos = await db.scheduledVideo.findMany({
      where: whereClause,
      include: {
        approvedVideo: true,
        child: {
          select: {
            id: true,
            name: true,
          }
        },
      },
      orderBy: {
        scheduledDate: 'asc',
      },
    });
    
    // Format response
    const formattedVideos = scheduledVideos.map(scheduled => ({
      id: scheduled.id,
      childId: scheduled.childId,
      childName: scheduled.child.name,
      approvedVideoId: scheduled.approvedVideoId,
      scheduledDate: scheduled.scheduledDate.toISOString(),
      isActive: scheduled.isActive,
      isWatched: scheduled.isWatched,
      watchedAt: scheduled.watchedAt?.toISOString(),
      carriedOver: scheduled.carriedOver,
      originalDate: scheduled.originalDate.toISOString(),
      
      // Video details from approved video
      title: scheduled.approvedVideo.title,
      thumbnail: scheduled.approvedVideo.thumbnail,
      duration: scheduled.approvedVideo.duration,
      channelName: scheduled.approvedVideo.channelName,
      youtubeId: scheduled.approvedVideo.youtubeId,
      description: scheduled.approvedVideo.description,
      summary: scheduled.approvedVideo.summary,
      
      createdAt: scheduled.createdAt.toISOString(),
      updatedAt: scheduled.updatedAt.toISOString(),
    }));

    console.log('📅 Found', formattedVideos.length, 'scheduled videos for parent:', parent.id);

    return Response.json({
      scheduledVideos: formattedVideos,
      total: formattedVideos.length
    });
  } catch (error) {
    console.error('❌ Scheduled videos API error:', error);
    
    return Response.json(
      { 
        error: 'Failed to fetch scheduled videos',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: ExpoRequest): Promise<Response> {
  try {
    console.log('📅 Mobile API: Creating scheduled videos');
    
    // Extract real user ID from JWT token (same as approved videos API)
    let userId: string | null = null;
    
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      
      try {
        const base64Payload = token.split('.')[1];
        if (base64Payload) {
          const payload = JSON.parse(atob(base64Payload));
          userId = payload.sub;
          console.log('✅ User authenticated for scheduling:', userId);
        }
      } catch (tokenError) {
        console.log('⚠️ Token decode failed for scheduling');
        return Response.json({ error: 'Invalid token' }, { status: 401 });
      }
    } else {
      console.log('⚠️ No auth header for scheduling');
      return Response.json({ error: 'Unauthorized - Missing token' }, { status: 401 });
    }
    
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { approvedVideoIds, childrenIds, scheduledDate } = body;

    if (!approvedVideoIds?.length || !childrenIds?.length || !scheduledDate) {
      return Response.json({ 
        error: 'Missing required fields: approvedVideoIds, childrenIds, scheduledDate' 
      }, { status: 400 });
    }

    // Find or create parent (same pattern as approved videos API)
    let parent = await db.parent.findUnique({
      where: { clerkId: userId },
      include: { children: true },
    });

    if (!parent) {
      const timestamp = Date.now();
      const uniqueEmail = `parent-${timestamp}@mobile.app`;
      
      try {
        parent = await db.parent.create({
          data: {
            clerkId: userId,
            email: uniqueEmail,
            name: 'Mobile Parent',
          },
          include: { children: true },
        });
        console.log('✅ Created new parent for scheduling');
      } catch (createError: any) {
        parent = await db.parent.findFirst({
          where: { clerkId: userId },
          include: { children: true },
        });
        
        if (!parent) {
          const randomId = Math.random().toString(36).substring(7);
          parent = await db.parent.create({
            data: {
              clerkId: userId,
              email: `mobile-${randomId}@temp.app`,
              name: 'Mobile Parent',
            },
            include: { children: true },
          });
        }
      }
    }

    // Verify children belong to parent
    const validChildren = parent.children.filter(child => 
      childrenIds.includes(child.id)
    );

    if (validChildren.length !== childrenIds.length) {
      return Response.json({ error: 'Some children not found' }, { status: 400 });
    }

    // Create scheduled videos
    const scheduledVideos = [];
    const dateObj = new Date(scheduledDate);

    for (const childId of childrenIds) {
      for (const approvedVideoId of approvedVideoIds) {
        try {
          const scheduled = await db.scheduledVideo.create({
            data: {
              childId,
              approvedVideoId,
              scheduledDate: dateObj,
              originalDate: dateObj,
              isActive: true,
              isWatched: false,
              carriedOver: false,
            },
            include: {
              approvedVideo: true,
              child: true
            }
          });

          scheduledVideos.push({
            id: scheduled.id,
            childId: scheduled.childId,
            childName: scheduled.child.name,
            approvedVideoId: scheduled.approvedVideoId,
            scheduledDate: scheduled.scheduledDate.toISOString(),
            title: scheduled.approvedVideo.title,
            thumbnail: scheduled.approvedVideo.thumbnail,
            duration: scheduled.approvedVideo.duration,
          });
        } catch (error) {
          // Skip if already scheduled (unique constraint)
          if (error instanceof Error && error.message.includes('Unique constraint')) {
            console.log('⚠️ Video already scheduled, skipping');
            continue;
          }
          throw error;
        }
      }
    }

    console.log('📅 Created', scheduledVideos.length, 'scheduled videos');

    return Response.json({
      scheduledVideos,
      total: scheduledVideos.length,
      message: `Successfully scheduled ${scheduledVideos.length} videos`
    });
  } catch (error) {
    console.error('❌ Schedule videos API error:', error);
    
    return Response.json(
      { 
        error: 'Failed to schedule videos',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: ExpoRequest): Promise<Response> {
  try {
    console.log('🗑️ Mobile API: Deleting scheduled video');
    
    // Extract real user ID from JWT token (same as approved videos API)
    let userId: string | null = null;
    
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      
      try {
        const base64Payload = token.split('.')[1];
        if (base64Payload) {
          const payload = JSON.parse(atob(base64Payload));
          userId = payload.sub;
          console.log('✅ User authenticated for deletion:', userId);
        }
      } catch (tokenError) {
        console.log('⚠️ Token decode failed for deletion');
        return Response.json({ error: 'Invalid token' }, { status: 401 });
      }
    } else {
      console.log('⚠️ No auth header for deletion');
      return Response.json({ error: 'Unauthorized - Missing token' }, { status: 401 });
    }
    
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const scheduledVideoId = url.searchParams.get('id');

    if (!scheduledVideoId) {
      return Response.json({ error: 'Scheduled video ID is required' }, { status: 400 });
    }

    // Find and verify ownership
    const scheduledVideo = await db.scheduledVideo.findFirst({
      where: {
        id: scheduledVideoId,
        child: {
          parent: {
            clerkId: userId
          }
        }
      }
    });

    if (!scheduledVideo) {
      return Response.json({ error: 'Scheduled video not found' }, { status: 404 });
    }

    // Delete the scheduled video
    await db.scheduledVideo.delete({
      where: { id: scheduledVideoId }
    });

    console.log('🗑️ Deleted scheduled video:', scheduledVideoId);

    return Response.json({
      message: 'Scheduled video deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete scheduled video API error:', error);
    
    return Response.json(
      { 
        error: 'Failed to delete scheduled video',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}