import AsyncStorage from '@react-native-async-storage/async-storage';

export interface VideoActivity {
  id: string;
  childId: string;
  childName: string;
  youtubeId: string;
  videoTitle: string;
  channelName: string;
  activityType: 'CLICK' | 'PLAY' | 'PAUSE' | 'RESUME' | 'SEEK' | 'COMPLETE' | 'EXIT';
  watchTimeSeconds: number;
  videoPosition: number;
  videoDuration?: string;
  completed: boolean;
  completionRate?: number;
  sessionId?: string;
  deviceInfo?: string;
  appVersion?: string;
  createdAt: string;
  approvedVideoId?: string;
}

export interface AppSession {
  id: string;
  childId: string;
  childName: string;
  sessionId: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  videosClicked: number;
  videosWatched: number;
  totalWatchTime: number;
  deviceInfo?: string;
  appVersion?: string;
  platform?: string;
}

export interface AnalyticsData {
  activities: VideoActivity[];
  sessions: AppSession[];
  lastUpdated: string;
}

const STORAGE_KEYS = {
  ACTIVITIES: '@kids_app_activities',
  SESSIONS: '@kids_app_sessions',
  ANALYTICS: '@kids_app_analytics'
};

// Generate user-specific storage keys
const getUserSpecificKeys = (userId?: string) => {
  const userPrefix = userId ? `_${userId}` : '';
  return {
    ACTIVITIES: `${STORAGE_KEYS.ACTIVITIES}${userPrefix}`,
    SESSIONS: `${STORAGE_KEYS.SESSIONS}${userPrefix}`,
    ANALYTICS: `${STORAGE_KEYS.ANALYTICS}${userPrefix}`
  };
};

class LocalActivityStorage {
  
  // Video Activities
  async saveActivity(activity: Omit<VideoActivity, 'id' | 'createdAt'>, userId?: string): Promise<VideoActivity> {
    try {
      const newActivity: VideoActivity = {
        ...activity,
        id: `activity_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        createdAt: new Date().toISOString()
      };

      const existingActivities = await this.getActivities(undefined, userId);
      const updatedActivities = [...existingActivities, newActivity];
      
      const keys = getUserSpecificKeys(userId);
      await AsyncStorage.setItem(keys.ACTIVITIES, JSON.stringify(updatedActivities));
      console.log('✅ Activity saved to local storage:', newActivity.activityType, newActivity.videoTitle);
      
      return newActivity;
    } catch (error) {
      console.error('❌ Error saving activity to local storage:', error);
      throw error;
    }
  }

  async getActivities(childId?: string, userId?: string): Promise<VideoActivity[]> {
    try {
      const keys = getUserSpecificKeys(userId);
      const activitiesJson = await AsyncStorage.getItem(keys.ACTIVITIES);
      const activities: VideoActivity[] = activitiesJson ? JSON.parse(activitiesJson) : [];
      
      if (childId) {
        return activities.filter(activity => activity.childId === childId);
      }
      
      return activities;
    } catch (error) {
      console.error('❌ Error getting activities from local storage:', error);
      return [];
    }
  }

  async clearActivities(userId?: string): Promise<void> {
    try {
      const keys = getUserSpecificKeys(userId);
      await AsyncStorage.removeItem(keys.ACTIVITIES);
      console.log('✅ Activities cleared from local storage');
    } catch (error) {
      console.error('❌ Error clearing activities:', error);
    }
  }

  // App Sessions
  async saveSession(session: Omit<AppSession, 'id'>, userId?: string): Promise<AppSession> {
    try {
      const newSession: AppSession = {
        ...session,
        id: `session_${Date.now()}_${Math.random().toString(36).substring(7)}`
      };

      const existingSessions = await this.getSessions(undefined, userId);
      const updatedSessions = [...existingSessions, newSession];
      
      const keys = getUserSpecificKeys(userId);
      await AsyncStorage.setItem(keys.SESSIONS, JSON.stringify(updatedSessions));
      console.log('✅ Session saved to local storage:', newSession.sessionId);
      
      return newSession;
    } catch (error) {
      console.error('❌ Error saving session to local storage:', error);
      throw error;
    }
  }

  async updateSession(sessionId: string, updates: Partial<AppSession>, userId?: string): Promise<AppSession | null> {
    try {
      const sessions = await this.getSessions(undefined, userId);
      const sessionIndex = sessions.findIndex(s => s.sessionId === sessionId);
      
      if (sessionIndex === -1) {
        console.log('⚠️ Session not found for update:', sessionId);
        return null;
      }

      sessions[sessionIndex] = { ...sessions[sessionIndex], ...updates };
      const keys = getUserSpecificKeys(userId);
      await AsyncStorage.setItem(keys.SESSIONS, JSON.stringify(sessions));
      
      console.log('✅ Session updated in local storage:', sessionId);
      return sessions[sessionIndex];
    } catch (error) {
      console.error('❌ Error updating session:', error);
      return null;
    }
  }

  async getSessions(childId?: string, userId?: string): Promise<AppSession[]> {
    try {
      const keys = getUserSpecificKeys(userId);
      const sessionsJson = await AsyncStorage.getItem(keys.SESSIONS);
      const sessions: AppSession[] = sessionsJson ? JSON.parse(sessionsJson) : [];
      
      if (childId) {
        return sessions.filter(session => session.childId === childId);
      }
      
      return sessions;
    } catch (error) {
      console.error('❌ Error getting sessions from local storage:', error);
      return [];
    }
  }

  async clearSessions(userId?: string): Promise<void> {
    try {
      const keys = getUserSpecificKeys(userId);
      await AsyncStorage.removeItem(keys.SESSIONS);
      console.log('✅ Sessions cleared from local storage');
    } catch (error) {
      console.error('❌ Error clearing sessions:', error);
    }
  }

  // Analytics
  async getAnalyticsData(childId?: string, days: number = 7, userId?: string): Promise<AnalyticsData> {
    try {
      const activities = await this.getActivities(childId, userId);
      const sessions = await this.getSessions(childId, userId);
      
      // Filter by date range (last N days)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const filteredActivities = activities.filter(activity => 
        new Date(activity.createdAt) >= cutoffDate
      );
      
      const filteredSessions = sessions.filter(session => 
        new Date(session.startTime) >= cutoffDate
      );

      return {
        activities: filteredActivities,
        sessions: filteredSessions,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error getting analytics data:', error);
      return {
        activities: [],
        sessions: [],
        lastUpdated: new Date().toISOString()
      };
    }
  }

  async getAnalyticsSummary(childId?: string, days: number = 7, userId?: string): Promise<{
    totalActivities: number;
    totalSessions: number;
    totalWatchTimeSeconds: number;
    averageCompletionRate: number;
    uniqueVideosWatched: number;
    totalSessionTimeSeconds: number;
    averageSessionTimeSeconds: number;
    mostWatchedVideos: Array<{
      youtubeId: string;
      title: string;
      channelName: string;
      watchCount: number;
      totalWatchTimeSeconds: number;
    }>;
    topChannels: Array<{
      name: string;
      watchCount: number;
      totalWatchTimeSeconds: number;
    }>;
    dailyActivity: Array<{
      date: string;
      activities_count: number;
      total_watch_time: number;
      unique_videos: number;
    }>;
    activityBreakdown: Array<{
      type: string;
      count: number;
    }>;
  }> {
    try {
      const data = await this.getAnalyticsData(childId, days, userId);
      
      const totalActivities = data.activities.length;
      const totalSessions = data.sessions.length;
      const totalWatchTimeSeconds = data.activities.reduce((sum, activity) => sum + (activity.watchTimeSeconds || 0), 0);
      
      // Calculate average completion rate
      const completionRates = data.activities
        .filter(activity => activity.completionRate !== undefined && activity.completionRate !== null)
        .map(activity => activity.completionRate!);
      const averageCompletionRate = completionRates.length > 0 
        ? completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length 
        : 0;

      // Unique videos watched
      const uniqueVideos = new Set(data.activities.map(activity => activity.youtubeId));
      const uniqueVideosWatched = uniqueVideos.size;

      // Session time calculations
      const totalSessionTimeSeconds = data.sessions.reduce((sum, session) => sum + (session.duration || 0), 0);
      const averageSessionTimeSeconds = totalSessions > 0 ? totalSessionTimeSeconds / totalSessions : 0;

      // Most watched videos
      const videoStats: Record<string, {
        youtubeId: string;
        title: string;
        channelName: string;
        watchCount: number;
        totalWatchTimeSeconds: number;
      }> = {};

      data.activities.forEach(activity => {
        const key = activity.youtubeId;
        if (!videoStats[key]) {
          videoStats[key] = {
            youtubeId: activity.youtubeId,
            title: activity.videoTitle,
            channelName: activity.channelName,
            watchCount: 0,
            totalWatchTimeSeconds: 0
          };
        }
        if (activity.activityType === 'PLAY' || activity.activityType === 'COMPLETE') {
          videoStats[key].watchCount++;
        }
        videoStats[key].totalWatchTimeSeconds += activity.watchTimeSeconds || 0;
      });

      const mostWatchedVideos = Object.values(videoStats)
        .sort((a, b) => b.watchCount - a.watchCount)
        .slice(0, 5);

      // Top channels
      const channelStats: Record<string, {
        name: string;
        watchCount: number;
        totalWatchTimeSeconds: number;
      }> = {};

      data.activities.forEach(activity => {
        const channel = activity.channelName;
        if (!channelStats[channel]) {
          channelStats[channel] = {
            name: channel,
            watchCount: 0,
            totalWatchTimeSeconds: 0
          };
        }
        if (activity.activityType === 'PLAY' || activity.activityType === 'COMPLETE') {
          channelStats[channel].watchCount++;
        }
        channelStats[channel].totalWatchTimeSeconds += activity.watchTimeSeconds || 0;
      });

      const topChannels = Object.values(channelStats)
        .sort((a, b) => b.totalWatchTimeSeconds - a.totalWatchTimeSeconds)
        .slice(0, 5);

      // Daily activity
      const dailyStats: Record<string, {
        date: string;
        activities_count: number;
        total_watch_time: number;
        unique_videos: Set<string>;
      }> = {};

      data.activities.forEach(activity => {
        const date = activity.createdAt.split('T')[0];
        if (!dailyStats[date]) {
          dailyStats[date] = {
            date,
            activities_count: 0,
            total_watch_time: 0,
            unique_videos: new Set()
          };
        }
        dailyStats[date].activities_count++;
        dailyStats[date].total_watch_time += activity.watchTimeSeconds || 0;
        dailyStats[date].unique_videos.add(activity.youtubeId);
      });

      const dailyActivity = Object.values(dailyStats).map(day => ({
        date: day.date,
        activities_count: day.activities_count,
        total_watch_time: day.total_watch_time,
        unique_videos: day.unique_videos.size
      }));

      // Activity breakdown
      const activityTypeStats: Record<string, number> = {};
      data.activities.forEach(activity => {
        activityTypeStats[activity.activityType] = (activityTypeStats[activity.activityType] || 0) + 1;
      });

      const activityBreakdown = Object.entries(activityTypeStats).map(([type, count]) => ({
        type,
        count
      }));

      return {
        totalActivities,
        totalSessions,
        totalWatchTimeSeconds,
        averageCompletionRate,
        uniqueVideosWatched,
        totalSessionTimeSeconds,
        averageSessionTimeSeconds,
        mostWatchedVideos,
        topChannels,
        dailyActivity,
        activityBreakdown
      };
    } catch (error) {
      console.error('❌ Error getting analytics summary:', error);
      return {
        totalActivities: 0,
        totalSessions: 0,
        totalWatchTimeSeconds: 0,
        averageCompletionRate: 0,
        uniqueVideosWatched: 0,
        totalSessionTimeSeconds: 0,
        averageSessionTimeSeconds: 0,
        mostWatchedVideos: [],
        topChannels: [],
        dailyActivity: [],
        activityBreakdown: []
      };
    }
  }

  // Utility methods
  async clearAllData(userId?: string): Promise<void> {
    try {
      await this.clearActivities(userId);
      await this.clearSessions(userId);
      console.log('✅ All activity data cleared from local storage');
    } catch (error) {
      console.error('❌ Error clearing all data:', error);
    }
  }

  async getStorageSize(userId?: string): Promise<{ activities: number; sessions: number; total: number }> {
    try {
      const keys = getUserSpecificKeys(userId);
      const activitiesJson = await AsyncStorage.getItem(keys.ACTIVITIES) || '[]';
      const sessionsJson = await AsyncStorage.getItem(keys.SESSIONS) || '[]';
      
      return {
        activities: activitiesJson.length,
        sessions: sessionsJson.length,
        total: activitiesJson.length + sessionsJson.length
      };
    } catch (error) {
      console.error('❌ Error getting storage size:', error);
      return { activities: 0, sessions: 0, total: 0 };
    }
  }

  // Clear data for specific user when they log out
  async clearUserData(userId: string): Promise<void> {
    try {
      await this.clearAllData(userId);
      console.log('✅ User-specific data cleared:', userId);
    } catch (error) {
      console.error('❌ Error clearing user data:', error);
    }
  }

  // Clear all storage data (for debugging or reset)
  async clearAllStorage(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const kidsAppKeys = allKeys.filter(key => 
        key.startsWith('@kids_app_activities') || 
        key.startsWith('@kids_app_sessions') || 
        key.startsWith('@kids_app_analytics')
      );
      
      if (kidsAppKeys.length > 0) {
        await AsyncStorage.multiRemove(kidsAppKeys);
        console.log('✅ All kids app storage cleared');
      }
    } catch (error) {
      console.error('❌ Error clearing all storage:', error);
    }
  }
}

export const localActivityStorage = new LocalActivityStorage();