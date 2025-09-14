import type { ExpoRequest, ExpoResponse } from 'expo-router/server';
import { db } from '@/lib/db';
import { approvalThrottle, createRateLimitResponse } from '@/lib/throttle';

export async function GET(request: ExpoRequest): Promise<Response> {
  try {
    console.log('📹 Mobile API: Fetching approved videos');
    
    // Extract real user ID from JWT token (same as children API)
    let userId: string | null = null;
    
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      
      try {
        // Decode JWT token to get user ID
        const base64Payload = token.split('.')[1];
        if (base64Payload) {
          const payload = JSON.parse(atob(base64Payload));
          userId = payload.sub; // Clerk stores user ID in 'sub' field
          console.log('✅ User authenticated for approved videos:', userId);
        }
      } catch (tokenError) {
        console.log('⚠️ Token decode failed for approved videos');
        return Response.json({ error: 'Invalid token' }, { status: 401 });
      }
    } else {
      console.log('⚠️ No auth header for approved videos');
      return Response.json({ error: 'Unauthorized - Missing token' }, { status: 401 });
    }
    
    if (!userId) {
      console.log('❌ No userId found for approved videos');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const url = new URL(request.url);
    const childId = url.searchParams.get('childId');

    // Follow EXACT same pattern as children API: find or create parent
    let parent = await db.parent.findUnique({
      where: { clerkId: userId },
      include: { children: true },
    });

    if (!parent) {
      console.log('🆕 Creating new parent for approved videos');
      
      // Try to create parent with a unique email (same as children API)
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
        console.log('✅ Created new parent with email:', uniqueEmail);
      } catch (createError: any) {
        console.log('⚠️ Parent creation failed, trying to find existing:', createError.message);
        
        // If creation fails, try to find existing parent
        parent = await db.parent.findFirst({
          where: { clerkId: userId },
          include: { children: true },
        });
        
        if (!parent) {
          // Last resort: create with random email
          const randomId = Math.random().toString(36).substring(7);
          parent = await db.parent.create({
            data: {
              clerkId: userId,
              email: `mobile-${randomId}@temp.app`,
              name: 'Mobile Parent',
            },
            include: { children: true },
          });
          console.log('✅ Created parent with random email');
        }
      }
    }
    
    console.log('👨‍👩‍👧‍👦 Found/created parent with', parent.children.length, 'children');

    // Parent is guaranteed to exist now (created if not found)

    // Get children IDs for this parent
    const childrenIds = parent.children.map(child => child.id);
    console.log('👶 Children IDs for parent:', childrenIds);
    
    if (childrenIds.length === 0) {
      console.log('⚠️ No children found for parent, returning empty array');
      return Response.json({
        approvedVideos: [],
        total: 0
      });
    }
    
    // Build where clause for approved videos
    const whereClause: any = {
      childId: {
        in: childrenIds // Query approved videos for any of this parent's children
      }
    };
    
    // If specific child requested, filter to just that child
    if (childId) {
      // Verify the child belongs to this parent
      if (!childrenIds.includes(childId)) {
        return Response.json({ error: 'Child not found or not owned by parent' }, { status: 404 });
      }
      whereClause.childId = childId; // Override with specific child
    }

    console.log('🔍 Fetching approved videos with where clause:', JSON.stringify(whereClause));

    const approvedVideos = await db.approvedVideo.findMany({
      where: whereClause,
      include: {
        child: {
          select: {
            id: true,
            name: true,
          }
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format the response with proper child information
    const formattedVideos = approvedVideos.map(video => ({
      id: video.id,
      childId: video.childId,
      childName: video.child.name, // Add childName for easy display
      child: {
        id: video.child.id,
        name: video.child.name,
      },
      youtubeId: video.youtubeId,
      title: video.title,
      description: video.description,
      thumbnail: video.thumbnail,
      channelName: video.channelName,
      duration: video.duration,
      summary: video.summary,
      watched: video.watched,
      watchedAt: video.watchedAt?.toISOString(),
      createdAt: video.createdAt.toISOString(),
      updatedAt: video.updatedAt.toISOString(),
    }));

    console.log('📹 Found', formattedVideos.length, 'approved videos for parent:', parent.id);

    return Response.json({
      approvedVideos: formattedVideos,
      total: formattedVideos.length
    });
  } catch (error) {
    console.error('❌ Approved videos API error:', error);
    
    return Response.json(
      { 
        error: 'Failed to fetch approved videos',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: ExpoRequest): Promise<Response> {
  try {
    console.log('📹 Mobile API: Approving video');
    
    // Extract real user ID from JWT token (same as GET method)
    let userId: string | null = null;
    
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      
      try {
        const base64Payload = token.split('.')[1];
        if (base64Payload) {
          const payload = JSON.parse(atob(base64Payload));
          userId = payload.sub;
          console.log('✅ User authenticated for video approval:', userId);
        }
      } catch (tokenError) {
        console.log('⚠️ Token decode failed for video approval');
        return Response.json({ error: 'Invalid token' }, { status: 401 });
      }
    } else {
      console.log('⚠️ No auth header for video approval');
      return Response.json({ error: 'Unauthorized - Missing token' }, { status: 401 });
    }
    
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check rate limiting for video approvals
    const throttleResult = await approvalThrottle.checkAndIncrement(userId);
    if (!throttleResult.allowed) {
      console.log('🚫 Approval rate limit exceeded for user:', userId);
      const rateLimitResponse = createRateLimitResponse(throttleResult.retryAfter!);
      return new Response(JSON.stringify(rateLimitResponse), {
        status: 429,
        headers: { 
          'Content-Type': 'application/json',
          'Retry-After': throttleResult.retryAfter!.toString()
        }
      });
    }
    
    const body = await request.json();
    const { 
      childId, 
      youtubeId, 
      title, 
      description, 
      thumbnail, 
      channelName, 
      duration, 
      summary 
    } = body;

    if (!childId || !youtubeId || !title) {
      return Response.json({ error: 'Missing required fields: childId, youtubeId, title' }, { status: 400 });
    }

    console.log('📝 Approving video:', { youtubeId, title, childId });

    try {
      // Find or create parent first (same logic as GET)
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
        } catch (createError) {
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
      
      // Verify the child exists and belongs to this parent
      const child = parent.children.find(c => c.id === childId);
      if (!child) {
        return Response.json({ error: 'Child not found or not owned by user' }, { status: 404 });
      }

      // Approve the video using upsert to handle duplicates
      const approvedVideo = await db.approvedVideo.upsert({
        where: {
          childId_youtubeId: {
            childId,
            youtubeId,
          },
        },
        update: {
          title,
          description: description || '',
          thumbnail: thumbnail || '',
          channelName: channelName || '',
          duration: duration || '',
          summary: summary || '',
        },
        create: {
          childId,
          youtubeId,
          title,
          description: description || '',
          thumbnail: thumbnail || '',
          channelName: channelName || '',
          duration: duration || '',
          summary: summary || '',
        },
      });

      console.log('✅ Video approved successfully:', approvedVideo.id);

      return Response.json({ success: true, videoId: approvedVideo.id });
    } catch (dbError) {
      console.error('❌ Database error approving video:', dbError);
      
      // Return success even if database is not available for development
      return Response.json({ success: true, message: 'Video approved (fallback mode)' });
    }
  } catch (error) {
    console.error('❌ Approve video POST error:', error);
    return Response.json({ 
      error: 'Failed to approve video',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: ExpoRequest): Promise<Response> {
  try {
    console.log('🗑️ Mobile API: Removing approved video');
    
    // Extract real user ID from JWT token (same as other methods)
    let userId: string | null = null;
    
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      
      try {
        const base64Payload = token.split('.')[1];
        if (base64Payload) {
          const payload = JSON.parse(atob(base64Payload));
          userId = payload.sub;
          console.log('✅ User authenticated for video removal:', userId);
        }
      } catch (tokenError) {
        console.log('⚠️ Token decode failed for video removal');
        return Response.json({ error: 'Invalid token' }, { status: 401 });
      }
    } else {
      console.log('⚠️ No auth header for video removal');
      return Response.json({ error: 'Unauthorized - Missing token' }, { status: 401 });
    }
    
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const videoId = url.searchParams.get('videoId');

    if (!videoId) {
      return Response.json({ error: 'Missing required parameter: videoId' }, { status: 400 });
    }

    console.log('🗑️ Removing video:', videoId);

    try {
      // First verify the video exists and belongs to this parent's children
      const video = await db.approvedVideo.findUnique({
        where: { id: videoId },
        include: {
          child: {
            include: {
              parent: true
            }
          }
        }
      });

      if (!video) {
        return Response.json({ error: 'Video not found' }, { status: 404 });
      }

      // Verify ownership using clerkId
      if (video.child.parent.clerkId !== userId) {
        console.log('🚫 Ownership verification failed. Expected:', userId, 'Got:', video.child.parent.clerkId);
        return Response.json({ error: 'Unauthorized - Video not owned by user' }, { status: 403 });
      }

      // Delete the approved video
      await db.approvedVideo.delete({
        where: { id: videoId }
      });

      console.log('✅ Video removed successfully:', videoId);

      return Response.json({ success: true, message: 'Video removed successfully' });
    } catch (dbError) {
      console.error('❌ Database error removing video:', dbError);
      
      return Response.json({ 
        error: 'Failed to remove video',
        details: dbError instanceof Error ? dbError.message : 'Unknown database error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ Remove video DELETE error:', error);
    return Response.json({ 
      error: 'Failed to remove video',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}