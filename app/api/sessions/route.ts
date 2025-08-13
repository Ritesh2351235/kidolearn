import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      childId,
      deviceInfo,
      appVersion,
      platform
    } = body;

    if (!childId) {
      return NextResponse.json(
        { error: 'Missing required field: childId' },
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

    // Generate unique session ID
    const sessionId = uuidv4();

    // Create new session
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

    return NextResponse.json({
      success: true,
      sessionId: session.sessionId,
      message: 'Session started successfully'
    });

  } catch (error) {
    console.error('Error starting session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing required field: sessionId' },
        { status: 400 }
      );
    }

    // Find the session and verify ownership
    const session = await db.appSession.findFirst({
      where: {
        sessionId,
        child: {
          parent: {
            clerkId: userId
          }
        }
      }
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found or unauthorized' }, { status: 404 });
    }

    // Calculate duration
    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - session.startTime.getTime()) / 1000);

    // Update session with end time and duration
    const updatedSession = await db.appSession.update({
      where: { sessionId },
      data: {
        endTime,
        duration
      }
    });

    return NextResponse.json({
      success: true,
      sessionId: updatedSession.sessionId,
      duration,
      message: 'Session ended successfully'
    });

  } catch (error) {
    console.error('Error ending session:', error);
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
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get sessions for specific child or all children of the parent
    const whereClause = childId ? { childId } : {
      child: {
        parent: {
          clerkId: userId
        }
      }
    };

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
      orderBy: { startTime: 'desc' },
      take: limit,
      skip: offset
    });

    const totalCount = await db.appSession.count({
      where: whereClause
    });

    return NextResponse.json({
      sessions,
      totalCount,
      limit,
      offset,
      hasMore: offset + limit < totalCount
    });

  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}