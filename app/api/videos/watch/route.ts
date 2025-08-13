import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

export async function PATCH(request: NextRequest) {
  try {
    console.log('📱 Mobile API: Marking video as watched');
    
    const { userId } = await auth();
    if (!userId) {
      console.log('❌ No userId found in auth');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { videoId, childId } = body;

    if (!videoId || !childId) {
      console.log('❌ Missing videoId or childId');
      return NextResponse.json({ 
        error: 'Video ID and Child ID are required' 
      }, { status: 400 });
    }

    console.log('✅ User authenticated:', userId);
    console.log('🎬 Marking video as watched:', { videoId, childId });

    // First, verify the parent owns this child
    const parent = await db.parent.findUnique({
      where: { clerkId: userId },
      include: {
        children: {
          include: {
            videos: true
          }
        }
      }
    });

    if (!parent) {
      console.log('❌ Parent not found');
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
    }

    const child = parent.children.find(c => c.id === childId);
    if (!child) {
      console.log('❌ Child not found');
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    // Find the approved video
    const approvedVideo = child.videos.find(v => v.id === videoId);
    if (!approvedVideo) {
      console.log('❌ Approved video not found');
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Update the video as watched
    const updatedVideo = await db.approvedVideo.update({
      where: { id: videoId },
      data: { 
        watched: true,
        watchedAt: new Date()
      }
    });

    console.log('✅ Video marked as watched successfully');

    return NextResponse.json({ 
      success: true,
      videoId: updatedVideo.id,
      watched: updatedVideo.watched,
      watchedAt: updatedVideo.watchedAt
    });
  } catch (error) {
    console.error('❌ Watch video API error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to mark video as watched',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}