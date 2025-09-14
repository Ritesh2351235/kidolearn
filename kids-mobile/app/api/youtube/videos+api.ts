/**
 * Optimized YouTube Videos API for batch video details
 */

import type { ExpoRequest, ExpoResponse } from 'expo-router/server';
import { youtube } from '@/lib/youtube';

export async function POST(request: ExpoRequest): Promise<ExpoResponse> {
  try {
    const body = await request.json();
    const { videoIds } = body;

    if (!videoIds || !Array.isArray(videoIds) || videoIds.length === 0) {
      return Response.json({
        error: 'Invalid video IDs',
        videos: []
      }, { status: 400 });
    }

    console.log('📊 Fetching video details for:', videoIds.length, 'videos');

    // Batch fetch video details (1 unit for up to 50 videos)
    const videoDetails = await youtube.videos.list({
      part: ['snippet', 'contentDetails', 'statistics'],
      id: videoIds.slice(0, 50), // Limit to 50 videos per request
    });

    const videos = videoDetails.data.items?.map(video => ({
      id: video.id!,
      title: video.snippet?.title || '',
      description: video.snippet?.description || '',
      thumbnail: video.snippet?.thumbnails?.high?.url || video.snippet?.thumbnails?.medium?.url || '',
      highResThumbnail: video.snippet?.thumbnails?.maxres?.url || video.snippet?.thumbnails?.high?.url || '',
      channelName: video.snippet?.channelTitle || '',
      duration: formatDuration(video.contentDetails?.duration || ''),
      viewCount: video.statistics?.viewCount || '0',
      publishedAt: video.snippet?.publishedAt || '',
      categoryId: video.snippet?.categoryId || '',
      youtubeId: video.id!
    })) || [];

    return Response.json(videos);

  } catch (error) {
    console.error('❌ YouTube videos API error:', error);

    return Response.json({
      error: 'Failed to fetch video details',
      message: error instanceof Error ? error.message : 'Unknown error',
      videos: []
    }, { status: 500 });
  }
}

function formatDuration(duration: string): string {
  if (!duration) return '0:00';

  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '0:00';

  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}





