/**
 * Simple API Client for Kids App
 * Handles basic API calls with proper error handling
 */

import { networkManager } from './networkManager';

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

class SimpleApiClient {
  private apiBaseUrl: string;

  constructor() {
    // Get API base URL from environment or use fallback
    this.apiBaseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://172.16.22.127:8081';
    console.log('🌐 SimpleApiClient using:', this.apiBaseUrl);
  }

  // Get scheduled videos for a child
  async getScheduledVideos(childId: string, token: string): Promise<ApprovedVideo[]> {
    console.log('📅 Fetching scheduled videos for child:', childId);

    // Check internet connection first
    const hasInternet = await networkManager.requireConnection();
    if (!hasInternet) {
      throw new Error('Internet connection required');
    }

    try {
      const currentDate = new Date().toISOString().split('T')[0];
      const url = `${this.apiBaseUrl}/api/scheduled-videos?childId=${childId}&date=${currentDate}`;

      console.log('🔄 Making request to:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error details');
        console.error('❌ API Error:', response.status, errorText);

        if (response.status === 404) {
          console.log('📅 No scheduled videos found, trying regular videos...');
          return this.getRegularVideosAsScheduled(childId, token);
        }

        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Scheduled videos response:', data);

      // Transform scheduled videos to match ApprovedVideo interface
      if (data.scheduledVideos && Array.isArray(data.scheduledVideos)) {
        return data.scheduledVideos.map((video: any) => ({
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
      }

      return [];
    } catch (error) {
      console.error('❌ Error fetching scheduled videos:', error);

      // Fallback to regular videos as scheduled
      console.log('📹 Falling back to regular videos...');
      return this.getRegularVideosAsScheduled(childId, token);
    }
  }

  // Get regular approved videos and mark them as scheduled
  private async getRegularVideosAsScheduled(childId: string, token: string): Promise<ApprovedVideo[]> {
    try {
      const url = `${this.apiBaseUrl}/api/videos?childId=${childId}`;
      console.log('🔄 Fetching regular videos from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      });

      if (!response.ok) {
        throw new Error(`Regular videos API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Regular videos response:', data);

      if (data.videos && Array.isArray(data.videos)) {
        // Transform regular videos to scheduled format
        return data.videos.map((video: any, index: number) => ({
          id: `scheduled-${video.id}`,
          childId: childId,
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
          isScheduled: true,
          carriedOver: index > 2, // Mark some as carried over for demo
          scheduledVideoId: `scheduled-${video.id}`,
        }));
      }

      return [];
    } catch (error) {
      console.error('❌ Error fetching regular videos:', error);
      throw error;
    }
  }

  // Mark scheduled video as watched
  async markScheduledVideoAsWatched(scheduledVideoId: string, childId: string): Promise<void> {
    const hasInternet = await networkManager.requireConnection();
    if (!hasInternet) {
      throw new Error('Internet connection required');
    }

    try {
      const url = `${this.apiBaseUrl}/api/kids/scheduled-videos/watched`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scheduledVideoId, childId }),
        timeout: 10000,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error details');
        console.warn('⚠️ Failed to mark video as watched:', response.status, errorText);
        // Don't throw error - this is not critical
        return;
      }

      console.log('✅ Scheduled video marked as watched');
    } catch (error) {
      console.warn('⚠️ Error marking scheduled video as watched:', error);
      // Don't throw error - this is not critical for user experience
    }
  }

  // Get video URL with YouTube fallback
  async getVideoUrl(youtubeId: string, token: string): Promise<{
    youtubeId: string;
    embedUrl: string;
    iframeUrl: string;
    watchUrl: string;
    success: boolean;
  }> {
    const hasInternet = await networkManager.requireConnection();
    if (!hasInternet) {
      throw new Error('Internet connection required');
    }

    try {
      const url = `${this.apiBaseUrl}/api/videos/url?youtubeId=${youtubeId}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      if (!response.ok) {
        console.warn('⚠️ API video URL failed, using YouTube fallback');
        return this.getYouTubeFallbackUrls(youtubeId);
      }

      const data = await response.json();
      console.log('✅ Video URL from API');
      return data;
    } catch (error) {
      console.warn('⚠️ Video URL API error, using YouTube fallback:', error);
      return this.getYouTubeFallbackUrls(youtubeId);
    }
  }

  // Generate YouTube URLs as fallback
  private getYouTubeFallbackUrls(youtubeId: string) {
    return {
      youtubeId,
      embedUrl: `https://www.youtube.com/embed/${youtubeId}?autoplay=1&playsinline=1&rel=0&showinfo=0&controls=1&modestbranding=1`,
      iframeUrl: `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&playsinline=1&rel=0&showinfo=0&controls=1&modestbranding=1&iv_load_policy=3&fs=1`,
      watchUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
      success: true
    };
  }
}

export const simpleApiClient = new SimpleApiClient();
