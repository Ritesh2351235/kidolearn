import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    console.log('📱 App Session API: Managing session');
    
    const { userId } = await auth();
    if (!userId) {
      console.log('❌ No userId found in auth');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      action, // 'start' or 'end'
      childId,
      sessionId,
      deviceInfo,
      appVersion,
      platform,
      duration,
      videosClicked = 0,
      videosWatched = 0,
      totalWatchTime = 0
    } = body;

    console.log('📱 Session action:', action, 'for child:', childId);

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

    if (action === 'start') {
      // Start a new session
      const session = await db.appSession.create({
        data: {
          childId,
          sessionId,
          deviceInfo,
          appVersion,
          platform,
          startTime: new Date()
        }
      });

      console.log('✅ Session started:', session.id);

      return NextResponse.json({
        success: true,
        sessionId: session.sessionId,
        message: 'Session started successfully'
      });

    } else if (action === 'end') {
      // End existing session
      const session = await db.appSession.findFirst({
        where: {
          sessionId,
          childId
        }
      });

      if (!session) {
        console.log('⚠️ Session not found, creating end record');
        // Create a session record even if start wasn't recorded
        const endSession = await db.appSession.create({
          data: {
            childId,
            sessionId,
            deviceInfo,
            appVersion,
            platform,
            startTime: new Date(Date.now() - (duration || 0) * 1000),
            endTime: new Date(),
            duration: duration || 0,
            videosClicked: videosClicked || 0,
            videosWatched: videosWatched || 0,
            totalWatchTime: totalWatchTime || 0
          }
        });

        return NextResponse.json({
          success: true,
          sessionId: endSession.sessionId,
          message: 'Session ended and recorded'
        });
      }

      // Update existing session
      const updatedSession = await db.appSession.update({
        where: { id: session.id },
        data: {
          endTime: new Date(),
          duration: duration || Math.floor((Date.now() - session.startTime.getTime()) / 1000),
          videosClicked: videosClicked || 0,
          videosWatched: videosWatched || 0,
          totalWatchTime: totalWatchTime || 0
        }
      });

      console.log('✅ Session ended:', updatedSession.id);

      return NextResponse.json({
        success: true,
        sessionId: updatedSession.sessionId,
        duration: updatedSession.duration,
        message: 'Session ended successfully'
      });

    } else {
      return NextResponse.json({ error: 'Invalid action. Use "start" or "end"' }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ App Session API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to manage session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve sessions (for debugging/analytics)
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get sessions belonging to this user's children
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

    const sessions = await db.appSession.findMany({
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
        startTime: 'desc'
      },
      take: limit
    });

    return NextResponse.json({
      sessions: sessions.map(session => ({
        id: session.id,
        sessionId: session.sessionId,
        childId: session.childId,
        childName: session.child.name,
        startTime: session.startTime.toISOString(),
        endTime: session.endTime?.toISOString(),
        duration: session.duration,
        videosClicked: session.videosClicked,
        videosWatched: session.videosWatched,
        totalWatchTime: session.totalWatchTime,
        platform: session.platform
      }))
    });

  } catch (error) {
    console.error('❌ Get sessions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}