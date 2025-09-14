/**
 * Offline Video Manager for App Store Production
 * Handles video playback when backend APIs are unavailable
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logDebug, logError } from './productionConfig';

export interface OfflineVideo {
  id: string;
  youtubeId: string;
  title: string;
  channelName: string;
  duration?: string;
  thumbnail: string;
  description?: string;
  summary: string;
  watched: boolean;
  watchedAt?: string;
  isScheduled?: boolean;
  scheduledVideoId?: string;
  carriedOver?: boolean;
}

export interface OfflineChild {
  id: string;
  name: string;
  birthday: string;
  interests: string[];
  videos: OfflineVideo[];
}

class OfflineVideoManager {
  private readonly STORAGE_KEYS = {
    CHILDREN: '@kids_app_children',
    VIDEOS: '@kids_app_videos',
    ACTIVITY: '@kids_app_activity',
    SETTINGS: '@kids_app_settings',
  };

  // Generate YouTube URLs without API dependency
  generateVideoUrls(youtubeId: string) {
    return {
      youtubeId,
      embedUrl: `https://www.youtube.com/embed/${youtubeId}?autoplay=1&playsinline=1&rel=0&showinfo=0&controls=1&modestbranding=1`,
      iframeUrl: `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&playsinline=1&rel=0&showinfo=0&controls=1&modestbranding=1&iv_load_policy=3&fs=1`,
      watchUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
      success: true
    };
  }

  // Store children data locally
  async storeChildren(children: OfflineChild[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEYS.CHILDREN, JSON.stringify(children));
      logDebug('✅ Children data stored offline');
    } catch (error) {
      logError('❌ Failed to store children data offline:', error);
    }
  }

  // Retrieve children data from local storage
  async getChildren(): Promise<OfflineChild[]> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEYS.CHILDREN);
      if (data) {
        const children = JSON.parse(data);
        logDebug('✅ Retrieved children data from offline storage');
        return children;
      }
    } catch (error) {
      logError('❌ Failed to retrieve children data from offline storage:', error);
    }

    // Return default sample data for first-time users
    return this.getDefaultSampleData();
  }

  // Store videos for a specific child
  async storeVideosForChild(childId: string, videos: OfflineVideo[]): Promise<void> {
    try {
      const key = `${this.STORAGE_KEYS.VIDEOS}_${childId}`;
      await AsyncStorage.setItem(key, JSON.stringify(videos));
      logDebug('✅ Videos stored offline for child:', childId);
    } catch (error) {
      logError('❌ Failed to store videos offline:', error);
    }
  }

  // Retrieve videos for a specific child
  async getVideosForChild(childId: string): Promise<OfflineVideo[]> {
    try {
      const key = `${this.STORAGE_KEYS.VIDEOS}_${childId}`;
      const data = await AsyncStorage.getItem(key);
      if (data) {
        const videos = JSON.parse(data);
        logDebug('✅ Retrieved videos from offline storage for child:', childId);
        return videos;
      }
    } catch (error) {
      logError('❌ Failed to retrieve videos from offline storage:', error);
    }

    // Return sample videos for demonstration
    return this.getSampleVideos();
  }

  // Track video activity offline (store locally)
  async trackVideoActivity(activity: {
    activityType: string;
    childId: string;
    youtubeId: string;
    videoTitle: string;
    channelName: string;
    videoDuration?: string;
    videoPosition?: number;
    approvedVideoId?: string;
  }): Promise<void> {
    try {
      const existingData = await AsyncStorage.getItem(this.STORAGE_KEYS.ACTIVITY);
      const activities = existingData ? JSON.parse(existingData) : [];

      const newActivity = {
        ...activity,
        timestamp: new Date().toISOString(),
        id: `${Date.now()}_${Math.random()}`,
      };

      activities.push(newActivity);

      // Keep only last 1000 activities to manage storage
      if (activities.length > 1000) {
        activities.splice(0, activities.length - 1000);
      }

      await AsyncStorage.setItem(this.STORAGE_KEYS.ACTIVITY, JSON.stringify(activities));
      logDebug('✅ Video activity tracked offline:', activity.activityType);
    } catch (error) {
      logError('❌ Failed to track video activity offline:', error);
    }
  }

  // Mark video as watched offline
  async markVideoAsWatched(childId: string, videoId: string): Promise<void> {
    try {
      const videos = await this.getVideosForChild(childId);
      const updatedVideos = videos.map(video => {
        if (video.id === videoId || video.youtubeId === videoId) {
          return {
            ...video,
            watched: true,
            watchedAt: new Date().toISOString(),
          };
        }
        return video;
      });

      await this.storeVideosForChild(childId, updatedVideos);
      logDebug('✅ Video marked as watched offline:', videoId);
    } catch (error) {
      logError('❌ Failed to mark video as watched offline:', error);
    }
  }

  // Get default sample data for demonstration
  private getDefaultSampleData(): OfflineChild[] {
    return [
      {
        id: 'demo_child_1',
        name: 'Alex',
        birthday: '2018-06-15',
        interests: ['science', 'animals', 'music'],
        videos: this.getSampleVideos(),
      },
    ];
  }

  // Sample videos for demonstration (real educational content)
  private getSampleVideos(): OfflineVideo[] {
    return [
      {
        id: 'demo_video_1',
        youtubeId: 'LXb3EKWsInQ', // Wheels On The Bus - Super Simple Songs
        title: 'Wheels On The Bus',
        channelName: 'Super Simple Songs',
        duration: '2:30',
        thumbnail: 'https://img.youtube.com/vi/LXb3EKWsInQ/maxresdefault.jpg',
        description: 'Classic kids nursery rhyme about the wheels on the bus',
        summary: 'Fun and educational nursery rhyme for kids',
        watched: false,
        isScheduled: true,
      },
      {
        id: 'demo_video_2',
        youtubeId: 'xpVfcZ0ZcFM', // Old MacDonald Had A Farm
        title: 'Old MacDonald Had A Farm',
        channelName: 'Super Simple Songs',
        duration: '3:15',
        thumbnail: 'https://img.youtube.com/vi/xpVfcZ0ZcFM/maxresdefault.jpg',
        description: 'Learn about farm animals with Old MacDonald',
        summary: 'Educational song about farm animals and sounds',
        watched: false,
        isScheduled: true,
      },
      {
        id: 'demo_video_3',
        youtubeId: '0VLxWIHRD4E', // ABC Song for Children
        title: 'ABC Song for Children',
        channelName: 'Cocomelon - Nursery Rhymes',
        duration: '2:45',
        thumbnail: 'https://img.youtube.com/vi/0VLxWIHRD4E/maxresdefault.jpg',
        description: 'Learn the alphabet with this fun ABC song',
        summary: 'Interactive alphabet learning for young children',
        watched: false,
        isScheduled: true,
        carriedOver: true,
      },
      {
        id: 'demo_video_4',
        youtubeId: 'D0Ajq682yrA', // Counting to 10 Song
        title: 'Count to 10 Song',
        channelName: 'Super Simple Songs',
        duration: '2:10',
        thumbnail: 'https://img.youtube.com/vi/D0Ajq682yrA/maxresdefault.jpg',
        description: 'Learn to count from 1 to 10 with this catchy song',
        summary: 'Fun counting song for early math skills',
        watched: false,
        isScheduled: true,
        carriedOver: true,
      },
      {
        id: 'demo_video_5',
        youtubeId: 'saF3-f0XWAY', // Colors Song for Kids
        title: 'Colors Song for Kids',
        channelName: 'Super Simple Songs',
        duration: '2:55',
        thumbnail: 'https://img.youtube.com/vi/saF3-f0XWAY/maxresdefault.jpg',
        description: 'Learn colors with this vibrant and fun song',
        summary: 'Educational video teaching primary and secondary colors',
        watched: false,
        isScheduled: true,
      },
    ];
  }

  // Clear all offline data (for testing)
  async clearOfflineData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.STORAGE_KEYS.CHILDREN,
        this.STORAGE_KEYS.VIDEOS,
        this.STORAGE_KEYS.ACTIVITY,
        this.STORAGE_KEYS.SETTINGS,
      ]);
      logDebug('✅ All offline data cleared');
    } catch (error) {
      logError('❌ Failed to clear offline data:', error);
    }
  }
}

export const offlineVideoManager = new OfflineVideoManager();
