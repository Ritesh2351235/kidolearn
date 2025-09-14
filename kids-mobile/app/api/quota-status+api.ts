/**
 * YouTube API Quota Status Endpoint
 * Provides quota usage information to users
 */

import type { ExpoRequest, ExpoResponse } from 'expo-router/server';
import { auth } from '@clerk/nextjs/server';
import { quotaManager } from '../../lib/youtubeQuotaManager';

export async function GET(request: ExpoRequest): Promise<ExpoResponse> {
  try {
    // Get user authentication
    const { userId } = auth();

    if (!userId) {
      return Response.json({
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Get user quota status
    const userStatus = quotaManager.getUserQuotaStatus(userId);
    const globalStatus = quotaManager.getGlobalQuotaStatus();

    console.log('📊 Quota status requested for user:', userId);

    return Response.json({
      user: {
        searchesUsed: userStatus.searchesUsed,
        searchesRemaining: userStatus.searchesRemaining,
        unitsUsed: userStatus.unitsUsed,
        canMakeRequests: userStatus.canMakeRequests,
        dailyLimit: 15 // Max searches per user per day
      },
      global: {
        totalUnitsUsed: globalStatus.totalUnitsUsed,
        totalUnitsRemaining: globalStatus.totalUnitsRemaining,
        activeUsers: globalStatus.activeUsers,
        dailyLimit: 9000 // Total daily quota limit
      },
      tips: {
        message: userStatus.canMakeRequests
          ? 'You can make more video searches today!'
          : 'Daily search limit reached. Try again tomorrow or browse cached content.',
        recommendedActions: userStatus.searchesRemaining <= 2
          ? ['Browse cached recommendations', 'Use scheduled content', 'Try different search terms']
          : ['Search for educational videos', 'Explore different categories', 'Schedule content for later']
      }
    });

  } catch (error) {
    console.error('❌ Quota status API error:', error);

    return Response.json({
      error: 'Failed to get quota status',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}





