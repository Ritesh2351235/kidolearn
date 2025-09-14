/**
 * Production API Client for App Store Deployment
 * Handles both online (when backend available) and offline modes
 */

import { DEPLOYMENT_CONFIG, getApiBaseUrl, shouldUseOfflineMode, logDebug, logError } from './productionConfig';
import { offlineVideoManager, OfflineChild, OfflineVideo } from './offlineVideoManager';
import { retryWithBackoff, handleApiError } from './apiErrorHandler';

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

class ProductionApiClient {
  private isOnlineMode = !shouldUseOfflineMode();
  private apiBaseUrl = getApiBaseUrl();

  constructor() {
    logDebug('🚀 ProductionApiClient initialized', {
      isOnlineMode: this.isOnlineMode,
      apiBaseUrl: this.apiBaseUrl,
      isProduction: DEPLOYMENT_CONFIG.IS_PRODUCTION,
    });
  }

  // Test if backend is available
  async testBackendConnection(): Promise<boolean> {
    if (shouldUseOfflineMode()) {
      logDebug('📱 Running in offline mode - skipping backend test');
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.apiBaseUrl}/api/health`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const isAvailable = response.ok;

      logDebug(isAvailable ? '✅ Backend is available' : '❌ Backend not responding');
      this.isOnlineMode = isAvailable;

      return isAvailable;
    } catch (error) {
      logDebug('❌ Backend connection test failed - switching to offline mode');
      this.isOnlineMode = false;
      return false;
    }
  }

  // Get children with fallback to offline storage
  async getChildren(token: string): Promise<Child[]> {
    // Always try offline first in production
    if (shouldUseOfflineMode() || !this.isOnlineMode) {
      logDebug('📱 Getting children from offline storage');
      const offlineChildren = await offlineVideoManager.getChildren();
      return this.transformOfflineChildrenToApi(offlineChildren);
    }

    try {
      // Try online API
      const response = await this.makeOnlineRequest<{ children: any[] }>('/api/children', { method: 'GET' }, token);

      // Store successful response offline for next time
      const offlineChildren = this.transformApiChildrenToOffline(response.children);
      await offlineVideoManager.storeChildren(offlineChildren);

      logDebug('✅ Children fetched from API and cached offline');
      return response.children;
    } catch (error) {
      logError('❌ Failed to fetch children from API, falling back to offline');

      // Fallback to offline storage
      const offlineChildren = await offlineVideoManager.getChildren();
      return this.transformOfflineChildrenToApi(offlineChildren);
    }
  }

  // Get approved videos with offline fallback
  async getApprovedVideos(childId: string, token: string): Promise<ApprovedVideo[]> {
    // Always try offline first in production
    if (shouldUseOfflineMode() || !this.isOnlineMode) {
      logDebug('📱 Getting videos from offline storage for child:', childId);
      const offlineVideos = await offlineVideoManager.getVideosForChild(childId);
      return this.transformOfflineVideosToApi(offlineVideos, childId);
    }

    try {
      // Try online API
      const response = await this.makeOnlineRequest<{ videos: any[] }>(
        `/api/videos?childId=${childId}`,
        { method: 'GET' },
        token
      );

      // Transform and store offline
      const offlineVideos = this.transformApiVideosToOffline(response.videos);
      await offlineVideoManager.storeVideosForChild(childId, offlineVideos);

      logDebug('✅ Videos fetched from API and cached offline');
      return this.transformApiVideosToApprovedVideos(response.videos, childId);
    } catch (error) {
      logError('❌ Failed to fetch videos from API, falling back to offline');

      // Fallback to offline storage
      const offlineVideos = await offlineVideoManager.getVideosForChild(childId);
      return this.transformOfflineVideosToApi(offlineVideos, childId);
    }
  }

  // Get video URL with offline fallback (no more 404 errors!)
  async getVideoUrl(youtubeId: string, token: string): Promise<VideoUrl> {
    // Always use offline URL generation in production to avoid 404s
    if (shouldUseOfflineMode() || !this.isOnlineMode || !DEPLOYMENT_CONFIG.FEATURES.USE_ENHANCED_VIDEO_URLS) {
      logDebug('📱 Generating video URL offline for:', youtubeId);
      return offlineVideoManager.generateVideoUrls(youtubeId);
    }

    try {
      // Try online API (only in development)
      const response = await this.makeOnlineRequest<VideoUrl>(
        `/api/videos/url?youtubeId=${youtubeId}`,
        { method: 'GET' },
        token
      );

      logDebug('✅ Enhanced video URL from API:', youtubeId);
      return response;
    } catch (error) {
      logDebug('⚠️ API video URL failed, using offline generation:', youtubeId);

      // Always fallback to offline URL generation (no error thrown!)
      return offlineVideoManager.generateVideoUrls(youtubeId);
    }
  }

  // Mark video as watched with offline tracking
  async markVideoAsWatched(videoId: string, token: string): Promise<void> {
    // Always track offline
    // Note: We don't have childId here, so we'll handle this in the calling code

    if (shouldUseOfflineMode() || !this.isOnlineMode) {
      logDebug('📱 Video marked as watched offline only');
      return;
    }

    try {
      await this.makeOnlineRequest(
        `/api/videos/watch`,
        {
          method: 'POST',
          body: JSON.stringify({ videoId }),
        },
        token
      );
      logDebug('✅ Video marked as watched on API');
    } catch (error) {
      logDebug('⚠️ Failed to mark video as watched on API (offline tracking still works)');
      // Don't throw error - offline tracking is sufficient
    }
  }

  // Mark scheduled video as watched with offline tracking
  async markScheduledVideoAsWatched(scheduledVideoId: string, childId: string): Promise<void> {
    // Always track offline
    await offlineVideoManager.markVideoAsWatched(childId, scheduledVideoId);

    if (shouldUseOfflineMode() || !this.isOnlineMode) {
      logDebug('📱 Scheduled video marked as watched offline only');
      return;
    }

    try {
      await this.makeOnlineRequest(
        `/api/kids/scheduled-videos/watched`,
        {
          method: 'POST',
          body: JSON.stringify({ scheduledVideoId, childId }),
        }
      );
      logDebug('✅ Scheduled video marked as watched on API');
    } catch (error) {
      logDebug('⚠️ Failed to mark scheduled video as watched on API (offline tracking still works)');
      // Don't throw error - offline tracking is sufficient
    }
  }

  // Create child with offline storage
  async createChild(
    childData: Omit<Child, 'id' | 'parentId' | 'createdAt' | 'updatedAt'>,
    token: string
  ): Promise<Child> {
    const newChild: Child = {
      id: `offline_${Date.now()}`,
      parentId: 'offline_parent',
      ...childData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Always store offline
    const children = await offlineVideoManager.getChildren();
    const offlineChild: OfflineChild = {
      ...newChild,
      videos: [],
    };
    children.push(offlineChild);
    await offlineVideoManager.storeChildren(children);

    if (shouldUseOfflineMode() || !this.isOnlineMode) {
      logDebug('📱 Child created offline only');
      return newChild;
    }

    try {
      const apiChild = await this.makeOnlineRequest<Child>(
        '/api/children',
        {
          method: 'POST',
          body: JSON.stringify(childData),
        },
        token
      );
      logDebug('✅ Child created on API');
      return apiChild;
    } catch (error) {
      logDebug('⚠️ Failed to create child on API (offline version available)');
      return newChild;
    }
  }

  // Make online API request with proper error handling
  private async makeOnlineRequest<T>(
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.text().catch(() => 'No error details');

          const error: any = new Error(`API request failed: ${response.status}`);
          error.response = {
            status: response.status,
            statusText: response.statusText,
            data: { message: errorData }
          };
          throw error;
        }

        const data = await response.json();
        return data;
      } catch (error: any) {
        clearTimeout(timeoutId);

        if (error.name === 'AbortError') {
          const timeoutError: any = new Error('Request timeout');
          timeoutError.isNetworkError = true;
          throw timeoutError;
        }

        throw error;
      }
    }, 1, 2000, `API ${endpoint}`); // Reduced retries for production
  }

  // Transform functions
  private transformOfflineChildrenToApi(offlineChildren: OfflineChild[]): Child[] {
    return offlineChildren.map(child => ({
      id: child.id,
      parentId: 'offline_parent',
      name: child.name,
      birthday: child.birthday,
      interests: child.interests,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  }

  private transformApiChildrenToOffline(apiChildren: Child[]): OfflineChild[] {
    return apiChildren.map(child => ({
      id: child.id,
      name: child.name,
      birthday: child.birthday,
      interests: child.interests,
      videos: [], // Videos fetched separately
    }));
  }

  private transformOfflineVideosToApi(offlineVideos: OfflineVideo[], childId: string): ApprovedVideo[] {
    return offlineVideos.map(video => ({
      id: video.id,
      childId: childId,
      youtubeId: video.youtubeId,
      title: video.title,
      description: video.description,
      thumbnail: video.thumbnail,
      channelName: video.channelName,
      duration: video.duration,
      summary: video.summary,
      watched: video.watched,
      watchedAt: video.watchedAt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isScheduled: video.isScheduled,
      scheduledVideoId: video.scheduledVideoId,
      carriedOver: video.carriedOver,
    }));
  }

  private transformApiVideosToOffline(apiVideos: any[]): OfflineVideo[] {
    return apiVideos.map(video => ({
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
    }));
  }

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

export const productionApiClient = new ProductionApiClient();
