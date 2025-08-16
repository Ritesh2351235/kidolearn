import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getCurrentParent } from '@/lib/actions';
import { generateVideoSummary } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { videoTitle, videoDescription, childId } = await request.json();

    if (!videoTitle || !childId) {
      return NextResponse.json({ 
        error: 'Video title and child ID are required' 
      }, { status: 400 });
    }

    // Verify the child belongs to the authenticated parent
    const parent = await getCurrentParent();
    if (!parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
    }

    const child = parent.children.find(c => c.id === childId);
    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    console.log('🤖 Generating summary for:', videoTitle);

    // Calculate child age from birthday
    const childAge = Math.floor((Date.now() - new Date(child.birthday).getTime()) / (365.25 * 24 * 60 * 60 * 1000));

    // Generate the summary for this specific video
    const summary = await generateVideoSummary(
      videoTitle,
      videoDescription || '',
      childAge,
      child.interests
    );

    console.log('✅ Summary generated successfully');

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('❌ Summary generation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate summary',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}