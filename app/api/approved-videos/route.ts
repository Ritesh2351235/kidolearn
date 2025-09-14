import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getCurrentParent } from '@/lib/actions';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const parent = await getCurrentParent();
    
    if (!parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
    }

    const approvedVideos = await db.approvedVideo.findMany({
      where: {
        child: {
          parentId: parent.id,
        },
      },
      include: {
        child: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ approvedVideos });
  } catch (error) {
    console.error('Error fetching approved videos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch approved videos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const parent = await getCurrentParent();
    
    if (!parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
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
      return NextResponse.json({ 
        error: 'Missing required fields: childId, youtubeId, title' 
      }, { status: 400 });
    }

    // Verify child belongs to authenticated parent
    const child = await db.child.findFirst({
      where: { id: childId, parentId: parent.id },
    });

    if (!child) {
      return NextResponse.json({ error: 'Child not found or unauthorized' }, { status: 404 });
    }

    // Create or update approved video
    const approvedVideo = await db.approvedVideo.upsert({
      where: {
        childId_youtubeId: {
          childId,
          youtubeId,
        },
      },
      update: {
        title,
        description,
        thumbnail,
        channelName,
        duration,
        summary,
      },
      create: {
        childId,
        youtubeId,
        title,
        description,
        thumbnail,
        channelName,
        duration,
        summary,
      },
    });

    return NextResponse.json({ 
      success: true,
      videoId: approvedVideo.id
    });
  } catch (error) {
    console.error('Error approving video:', error);
    return NextResponse.json(
      { error: 'Failed to approve video' },
      { status: 500 }
    );
  }
}