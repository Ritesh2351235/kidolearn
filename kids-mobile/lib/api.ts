import { mobileRequestQueue } from './requestQueue';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

console.log('🌐 API Base URL:', API_BASE_URL);

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
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
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
      const response = await this.makeRequest<{ videos: any[] }>(
        `/api/videos?childId=${childId}`,
        { method: 'GET' },
        token
      );
      
      // Transform the API response to match our ApprovedVideo interface
      return response.videos.map(video => ({
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