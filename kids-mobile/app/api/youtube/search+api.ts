/**
 * Optimized YouTube Search API with Quota Management
 */

import type { ExpoRequest, ExpoResponse } from 'expo-router/server';
import { searchVideosAdvanced } from '@/lib/youtube';

export async function POST(request: ExpoRequest): Promise<ExpoResponse> {
  try {
    const body = await request.json();
    const { query, maxResults = 8, pageToken, filters } = body;

    console.log('🔍 Optimized YouTube search:', { query, maxResults });

    // Use existing searchVideosAdvanced but with reduced maxResults
    const result = await searchVideosAdvanced(query, {
      maxResults: Math.min(maxResults, 8), // Cap at 8 to save quota
      pageToken,
      filters
    });

    return Response.json({
      videos: result.videos,
      nextPageToken: result.nextPageToken,
      totalResults: result.totalResults
    });

  } catch (error) {
    console.error('❌ YouTube search API error:', error);

    return Response.json({
      error: 'Search failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      videos: [],
      nextPageToken: null
    }, { status: 500 });
  }
}





