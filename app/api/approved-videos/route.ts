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