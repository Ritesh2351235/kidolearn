import { mobileRequestQueue } from './requestQueue';

// API Configuration with better error handling
const getApiBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;

  if (envUrl) {
    console.log('🌐 Using configured API URL:', envUrl);
    return envUrl;
  }

  // Fallback URLs to try
  const fallbackUrls = [
    'http://172.16.22.127:3000', // Current detected IP
    'http://localhost:3000',     // Localhost fallback
    'http://127.0.0.1:3000',     // IP fallback
  ];

  console.log('⚠️ No EXPO_PUBLIC_API_URL configured, using fallback:', fallbackUrls[0]);
  return fallbackUrls[0];
};

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

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      console.log(`🔄 Making API request to: ${url}`);

      const response = await fetch(url, {
        ...options,
        headers,
        timeout: 10000, // 10 second timeout
      });

      if (!response.ok) {
        console.error(`❌ API request failed: ${response.status} ${response.statusText}`);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ API request successful for: ${endpoint}`);
      return data;
    } catch (error) {
      console.error(`🚨 Network error for ${url}:`, error);

      // Provide helpful error messages based on error type
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        throw new Error(`Cannot connect to server at ${API_BASE_URL}. Please check:\n1. Your development server is running on port 3000\n2. Your mobile device and computer are on the same WiFi network\n3. Your firewall allows connections on port 3000`);
      }

      throw error;
    }
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