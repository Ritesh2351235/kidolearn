import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const youtubeId = searchParams.get('youtubeId');

    if (!youtubeId) {
      return NextResponse.json({ error: 'YouTube ID required' }, { status: 400 });
    }

    // Generate YouTube embed URL for mobile video players
    const embedUrl = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&playsinline=1&rel=0&showinfo=0&controls=1`;
    
    // Also provide iframe embed URL for webview
    const iframeUrl = `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&playsinline=1&rel=0&showinfo=0&controls=1`;
    
    // Provide direct YouTube URL as fallback
    const watchUrl = `https://www.youtube.com/watch?v=${youtubeId}`;

    return NextResponse.json({
      youtubeId,
      embedUrl,
      iframeUrl,
      watchUrl,
      success: true
    });

  } catch (error) {
    console.error('❌ Video URL API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get video URL',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}