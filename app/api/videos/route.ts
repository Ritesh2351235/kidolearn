import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('📱 Mobile API: Fetching approved videos');
    
    const { userId } = await auth();
    if (!userId) {
      console.log('❌ No userId found in auth');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const childId = searchParams.get('childId');

    if (!childId) {
      console.log('❌ No childId provided');
      return NextResponse.json({ error: 'Child ID required' }, { status: 400 });
    }

    console.log('✅ User authenticated:', userId);
    console.log('🔍 Looking for approved videos for child:', childId);

    // First, verify the child belongs to the authenticated parent
    const parent = await db.parent.findUnique({
      where: { clerkId: userId },
      include: { 
        children: {
          where: { id: childId },
          include: {
            videos: {
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      },
    });

    if (!parent) {
      console.log('❌ Parent not found');
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
    }

    const child = parent.children[0];
    if (!child) {
      console.log('❌ Child not found or doesn\'t belong to parent');
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    console.log('👶 Child found:', child.name);
    console.log('📹 Child has', child.videos.length, 'approved videos');

    // Get approved videos for this child
    const approvedVideos = child.videos || [];
    
    console.log('📹 Found', approvedVideos.length, 'approved videos');

    // Format videos for mobile app
    const videosForMobile = approvedVideos.map(video => ({
      id: video.id,
      youtubeId: video.youtubeId,
      title: video.title,
      description: video.description,
      thumbnail: video.thumbnail,
      channelName: video.channelName,
      duration: video.duration,
      summary: video.summary,
      watched: video.watched || false,
      watchedAt: video.watchedAt,
      createdAt: video.createdAt,
      updatedAt: video.updatedAt,
    }));

    return NextResponse.json({ 
      videos: videosForMobile,
      total: videosForMobile.length,
      childName: child.name
    });
  } catch (error) {
    console.error('❌ Videos API error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch approved videos',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}