/**
 * Internet-Required API Client
 * Requires active internet connection - shows "No Internet" popup when offline
 */

import { networkManager } from './networkManager';
import { getApiBaseUrl, logDebug, logError } from './productionConfig';
import { retryWithBackoff } from './apiErrorHandler';

export interface VideoUrl {
  youtubeId: string;
  embedUrl: string;
  iframeUrl: string;
  watchUrl: string;
  success: boolean;
}

export interface Child {
  id: string;
  parentId: string;
  name: string;
  birthday: string;
  interests: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ApprovedVideo {
  id: string;
  childId: string;
  youtubeId: string;
  title: string;
  description?: string;
  thumbnail: string;
  channelName: string;
  duration?: string;
  summary: string;
  watched: boolean;
  watchedAt?: string;
  createdAt: string;
  updatedAt: string;
  isScheduled?: boolean;
  scheduledVideoId?: string;
  carriedOver?: boolean;
}

class InternetRequiredApiClient {
  private apiBaseUrl = getApiBaseUrl();

  constructor() {
    logDebug('🌐 InternetRequiredApiClient initialized', {
      apiBaseUrl: this.apiBaseUrl,
    });
  }

  // Get children - requires internet
  async getChildren(token: string): Promise<Child[]> {
    return networkManager.withNetworkCheck(async () => {
      const response = await this.makeRequest<{ children: any[] }>('/api/children', { method: 'GET' }, token);
      return response.children;
    }, 'Failed to load children profiles');
  }

  // Get approved videos - requires internet
  async getApprovedVideos(childId: string, token: string): Promise<ApprovedVideo[]> {
    return networkManager.withNetworkCheck(async () => {
      const response = await this.makeRequest<{ videos: any[] }>(
        `/api/videos?childId=${childId}`,
        { method: 'GET' },
        token
      );

      return this.transformApiVideosToApprovedVideos(response.videos, childId);
    }, 'Failed to load videos');
  }

  // Get scheduled videos - requires internet
  async getScheduledVideos(childId: string, token: string): Promise<ApprovedVideo[]> {
    return networkManager.withNetworkCheck(async () => {
      const currentDate = new Date().toISOString().split('T')[0];
      const response = await this.makeRequest<{ scheduledVideos: any[] }>(
        `/api/scheduled-videos?childId=${childId}&date=${currentDate}`,
        { method: 'GET' },
        token
      );

      return response.scheduledVideos.map((video: any) => ({
        id: `scheduled-${video.id}`,
        childId: video.childId,
        youtubeId: video.youtubeId,
        title: video.title,
        description: video.description,
        thumbnail: video.thumbnail,
        channelName: video.channelName,
        duration: video.duration,
        summary: video.summary,
        watched: video.isWatched || false,
        watchedAt: video.watchedAt,
        createdAt: video.createdAt,
        updatedAt: video.updatedAt,
        isScheduled: true,
        carriedOver: video.carriedOver,
        scheduledVideoId: video.id,
      }));
    }, 'Failed to load scheduled videos');
  }

  // Get video URL - requires internet, but has YouTube fallback
  async getVideoUrl(youtubeId: string, token: string): Promise<VideoUrl> {
    // First check internet connection
    const hasConnection = await networkManager.requireConnection();
    if (!hasConnection) {
      throw new Error('Internet connection required');
    }

    try {
      const response = await this.makeRequest<VideoUrl>(
        `/api/videos/url?youtubeId=${youtubeId}`,
        { method: 'GET' },
        token
      );

      logDebug('✅ Enhanced video URL from API:', youtubeId);
      return response;
    } catch (error) {
      logDebug('⚠️ API video URL failed, using YouTube fallback:', youtubeId);

      // Fallback to YouTube URLs (still requires internet to play)
      return {
        youtubeId,
        embedUrl: `https://www.youtube.com/embed/${youtubeId}?autoplay=1&playsinline=1&rel=0&showinfo=0&controls=1&modestbranding=1`,
        iframeUrl: `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&playsinline=1&rel=0&showinfo=0&controls=1&modestbranding=1&iv_load_policy=3&fs=1`,
        watchUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
        success: true
      };
    }
  }

  // Mark video as watched - requires internet
  async markVideoAsWatched(videoId: string, token: string): Promise<void> {
    return networkManager.withNetworkCheck(async () => {
      await this.makeRequest(
        `/api/videos/watch`,
        {
          method: 'POST',
          body: JSON.stringify({ videoId }),
        },
        token
      );
      logDebug('✅ Video marked as watched on API');
    }, 'Failed to mark video as watched');
  }

  // Mark scheduled video as watched - requires internet
  async markScheduledVideoAsWatched(scheduledVideoId: string, childId: string): Promise<void> {
    return networkManager.withNetworkCheck(async () => {
      await this.makeRequest(
        `/api/kids/scheduled-videos/watched`,
        {
          method: 'POST',
          body: JSON.stringify({ scheduledVideoId, childId }),
        }
      );
      logDebug('✅ Scheduled video marked as watched on API');
    }, 'Failed to mark scheduled video as watched');
  }

  // Create child - requires internet
  async createChild(
    childData: Omit<Child, 'id' | 'parentId' | 'createdAt' | 'updatedAt'>,
    token: string
  ): Promise<Child> {
    return networkManager.withNetworkCheck(async () => {
      const child = await this.makeRequest<Child>(
        '/api/children',
        {
          method: 'POST',
          body: JSON.stringify(childData),
        },
        token
      );
      logDebug('✅ Child created on API');
      return child;
    }, 'Failed to create child profile');
  }

  // Make API request with proper error handling
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    token?: string
  ): Promise<T> {
    const url = `${this.apiBaseUrl}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return retryWithBackoff(async () => {
      logDebug(`🔄 Making API request to: ${url}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      try {
        const response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.text().catch(() => 'No error details');
          logError(`❌ API request failed: ${response.status} ${response.statusText}`, errorData);

          const error: any = new Error(`API request failed: ${response.status} ${response.statusText}`);
          error.response = {
            status: response.status,
            statusText: response.statusText,
            data: { message: errorData }
          };
          throw error;
        }

        const data = await response.json();
        logDebug(`✅ API request successful for: ${endpoint}`);
        return data;
      } catch (error: any) {
        clearTimeout(timeoutId);

        if (error.name === 'AbortError') {
          logError(`⏰ Request timeout for ${url}`);
          const timeoutError: any = new Error('Request timeout - server may be unavailable');
          timeoutError.isNetworkError = true;
          throw timeoutError;
        }

        logError(`🚨 Network error for ${url}:`, error);

        // Enhance error with better context
        if (error instanceof TypeError && error.message.includes('Network request failed')) {
          const networkError: any = new Error(`Cannot connect to server. Please check your internet connection.`);
          networkError.isNetworkError = true;
          networkError.request = { url };
          throw networkError;
        }

        throw error;
      }
    }, 2, 1000, `API ${endpoint}`);
  }

  // Transform API videos to ApprovedVideo format
  private transformApiVideosToApprovedVideos(apiVideos: any[], childId: string): ApprovedVideo[] {
    return apiVideos.map(video => ({
      id: video.id,
      childId: childId,
      youtubeId: video.youtubeId,
      title: video.title,
      description: video.description,
      thumbnail: video.thumbnail,
      channelName: video.channelName,
      duration: video.duration,
      summary: video.summary,
      watched: video.watched || false,
      watchedAt: video.watchedAt?.toISOString?.() || video.watchedAt,
      createdAt: video.createdAt?.toISOString?.() || video.createdAt,
      updatedAt: video.updatedAt?.toISOString?.() || video.updatedAt,
    }));
  }
}

export const internetRequiredApiClient = new InternetRequiredApiClient();
