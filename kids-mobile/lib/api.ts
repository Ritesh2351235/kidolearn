import { mobileRequestQueue } from './requestQueue';
import { withApiErrorHandling, retryWithBackoff } from './apiErrorHandler';
import { getApiBaseUrl } from './productionConfig';

const API_BASE_URL = getApiBaseUrl();
console.log('🌐 Final API Base URL:', API_BASE_URL);

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
  // Optional fields for scheduled videos
  isScheduled?: boolean;
  carriedOver?: boolean;
  scheduledVideoId?: string;
}

export interface VideoUrl {
  youtubeId: string;
  embedUrl: string;
  iframeUrl: string;
  watchUrl: string;
  success: boolean;
}

class ApiClient {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    token?: string
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return retryWithBackoff(async () => {
      console.log(`🔄 Making API request to: ${url}`);

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
          console.error(`❌ API request failed: ${response.status} ${response.statusText}`, errorData);

          const error: any = new Error(`API request failed: ${response.status} ${response.statusText}`);
          error.response = {
            status: response.status,
            statusText: response.statusText,
            data: { message: errorData }
          };
          throw error;
        }

        const data = await response.json();
        console.log(`✅ API request successful for: ${endpoint}`);
        return data;
      } catch (error: any) {
        clearTimeout(timeoutId);

        if (error.name === 'AbortError') {
          console.error(`⏰ Request timeout for ${url}`);
          const timeoutError: any = new Error('Request timeout - server may be unavailable');
          timeoutError.isNetworkError = true;
          throw timeoutError;
        }

        console.error(`🚨 Network error for ${url}:`, error);

        // Enhance error with better context
        if (error instanceof TypeError && error.message.includes('Network request failed')) {
          const networkError: any = new Error(`Cannot connect to server. The backend may be offline or unreachable.`);
          networkError.isNetworkError = true;
          networkError.request = { url };
          throw networkError;
        }

        // Pass through API errors with response
        if (error.response) {
          throw error;
        }

        // For other errors, mark as network errors
        if (!error.isNetworkError) {
          error.isNetworkError = true;
          error.request = { url };
        }

        throw error;
      }
    }, 2, 1000, `API ${endpoint}`);
  }

  async getChildren(token: string): Promise<Child[]> {
    const requestId = `children-list`;

    return mobileRequestQueue.execute(requestId, async () => {
      const response = await this.makeRequest<{ children: any[] }>('/api/children', { method: 'GET' }, token);

      // The API now returns all the required fields
      return response.children;
    });
  }

  async createChild(
    childData: Omit<Child, 'id' | 'parentId' | 'createdAt' | 'updatedAt'>,
    token: string
  ): Promise<Child> {
    return this.makeRequest<Child>(
      '/api/children',
      {
        method: 'POST',
        body: JSON.stringify(childData),
      },
      token
    );
  }

  async getApprovedVideos(childId: string, token: string): Promise<ApprovedVideo[]> {
    const requestId = `videos-${childId}`;

    return mobileRequestQueue.execute(requestId, async () => {
      const response = await this.makeRequest<{ approvedVideos: any[] }>(
        `/api/approved-videos?childId=${childId}`,
        { method: 'GET' },
        token
      );

      // Transform the API response to match our ApprovedVideo interface
      return response.approvedVideos.map(video => ({
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
    });
  }

  async markVideoAsWatched(videoId: string, token: string): Promise<void> {
    await this.makeRequest(
      `/api/videos/watch`,
      {
        method: 'POST',
        body: JSON.stringify({ videoId }),
      },
      token
    );
  }

  async markScheduledVideoAsWatched(scheduledVideoId: string, childId: string): Promise<void> {
    await this.makeRequest(
      `/api/kids/scheduled-videos/watched`,
      {
        method: 'POST',
        body: JSON.stringify({ scheduledVideoId, childId }),
      }
    );
  }

  async getVideoUrl(youtubeId: string, token: string): Promise<VideoUrl> {
    const requestId = `video-url-${youtubeId}`;

    return mobileRequestQueue.execute(requestId, async () => {
      return this.makeRequest<VideoUrl>(
        `/api/videos/url?youtubeId=${youtubeId}`,
        { method: 'GET' },
        token
      );
    });
  }
}

export const apiClient = new ApiClient();