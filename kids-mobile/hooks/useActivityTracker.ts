import { useState, useRef, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useAuth } from '@clerk/clerk-expo';
import { getApiBaseUrl } from '@/lib/productionConfig';

export type ActivityType = 'CLICK' | 'PLAY' | 'PAUSE' | 'RESUME' | 'SEEK' | 'COMPLETE' | 'EXIT';

interface VideoActivityData {
  childId: string;
  approvedVideoId?: string;
  youtubeId: string;
  activityType: ActivityType;
  watchTimeSeconds?: number;
  videoPosition?: number;
  sessionId?: string;
  videoTitle: string;
  channelName: string;
  videoDuration?: string;
  completed?: boolean;
  completionRate?: number;
}

interface SessionData {
  childId: string;
  deviceInfo?: string;
  appVersion?: string;
  platform?: string;
}

export const useActivityTracker = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isTrackingSession, setIsTrackingSession] = useState(false);
  const watchTimeRef = useRef<number>(0);
  const lastPositionRef = useRef<number>(0);
  const watchStartTimeRef = useRef<number | null>(null);

  // Get authentication token from Clerk
  const { getToken } = useAuth();

  // Device and app information
  const deviceInfo = `${Device.brand || 'Unknown'} ${Device.modelName || 'Device'} - ${Platform.OS} ${Platform.Version}`;
  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const platform = Platform.OS;

  // Start a new session
  const startSession = useCallback(async (childId: string) => {
    try {
      const token = await getToken();
      if (!token) {
        console.error('No auth token available for session start');
        return null;
      }

      // Generate a unique session ID
      const localSessionId = `mobile-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      const response = await fetch(`${getApiBaseUrl()}/api/app-sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'start',
          childId,
          sessionId: localSessionId,
          deviceInfo,
          appVersion,
          platform
        })
      });

      if (response.ok) {
        setSessionId(localSessionId);
        setIsTrackingSession(true);
        console.log('✅ Session started:', localSessionId);
        return localSessionId;
      } else {
        console.error('Failed to start session:', response.status);
        return null;
      }
    } catch (error) {
      console.error('Error starting session:', error);
      return null;
    }
  }, [getToken, deviceInfo, appVersion, platform]);

  // End current session
  const endSession = useCallback(async (childId?: string) => {
    if (!sessionId) return;

    try {
      const token = await getToken();
      if (!token) {
        console.error('No auth token available for session end');
        setSessionId(null);
        setIsTrackingSession(false);
        return;
      }

      if (childId) {
        const response = await fetch(`${getApiBaseUrl()}/api/app-sessions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'end',
            childId,
            sessionId,
            // TODO: Add session statistics here if needed
          })
        });

        if (response.ok) {
          console.log('✅ Session ended successfully:', sessionId);
        } else {
          console.error('Failed to end session:', response.status);
        }
      }

      setSessionId(null);
      setIsTrackingSession(false);
    } catch (error) {
      console.error('Error ending session:', error);
      setSessionId(null);
      setIsTrackingSession(false);
    }
  }, [sessionId, getToken]);

  // Record video activity to database
  const recordActivity = useCallback(async (activityData: VideoActivityData) => {
    try {
      const token = await getToken();
      if (!token) {
        console.error('No auth token available for recording activity');
        return null;
      }

      const payload = {
        ...activityData,
        sessionId: sessionId || undefined,
        deviceInfo,
        appVersion,
      };

      console.log('📊 Recording activity to database:', payload);

      const response = await fetch(`${getApiBaseUrl()}/api/video-activities`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Activity recorded successfully:', result.activityId);
        return { success: true, activityId: result.activityId };
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to record activity:', response.status, errorData);
        return null;
      }
    } catch (error) {
      console.error('Error recording activity:', error);
      return null;
    }
  }, [sessionId, deviceInfo, appVersion, getToken]);

  // Track video click
  const trackVideoClick = useCallback(async (
    childId: string,
    youtubeId: string,
    videoTitle: string,
    channelName: string,
    approvedVideoId?: string
  ) => {
    return recordActivity({
      childId,
      approvedVideoId,
      youtubeId,
      activityType: 'CLICK',
      videoTitle,
      channelName,
    });
  }, [recordActivity]);

  // Start tracking watch time when video starts playing
  const startWatchTracking = useCallback((position: number = 0) => {
    watchStartTimeRef.current = Date.now();
    lastPositionRef.current = position;
  }, []);

  // Stop tracking watch time and return accumulated time
  const stopWatchTracking = useCallback((currentPosition: number = 0) => {
    if (watchStartTimeRef.current === null) return 0;

    const timeElapsed = (Date.now() - watchStartTimeRef.current) / 1000;
    const positionDiff = Math.abs(currentPosition - lastPositionRef.current);
    
    // Only count time if position change makes sense (not seeking)
    const watchTime = positionDiff < timeElapsed * 2 ? timeElapsed : positionDiff;
    
    watchTimeRef.current += watchTime;
    watchStartTimeRef.current = null;
    
    return watchTime;
  }, []);

  // Track video play
  const trackVideoPlay = useCallback(async (
    childId: string,
    youtubeId: string,
    videoTitle: string,
    channelName: string,
    videoDuration?: string,
    approvedVideoId?: string,
    position: number = 0
  ) => {
    startWatchTracking(position);
    
    return recordActivity({
      childId,
      approvedVideoId,
      youtubeId,
      activityType: 'PLAY',
      videoPosition: position,
      videoTitle,
      channelName,
      videoDuration,
    });
  }, [recordActivity, startWatchTracking]);

  // Track video pause
  const trackVideoPause = useCallback(async (
    childId: string,
    youtubeId: string,
    videoTitle: string,
    channelName: string,
    position: number,
    approvedVideoId?: string
  ) => {
    const watchTime = stopWatchTracking(position);
    
    return recordActivity({
      childId,
      approvedVideoId,
      youtubeId,
      activityType: 'PAUSE',
      watchTimeSeconds: Math.round(watchTime),
      videoPosition: position,
      videoTitle,
      channelName,
    });
  }, [recordActivity, stopWatchTracking]);

  // Track video completion
  const trackVideoComplete = useCallback(async (
    childId: string,
    youtubeId: string,
    videoTitle: string,
    channelName: string,
    videoDuration?: string,
    approvedVideoId?: string,
    finalPosition?: number
  ) => {
    const watchTime = stopWatchTracking(finalPosition || 0);
    const totalWatchTime = watchTimeRef.current + watchTime;
    
    // Calculate completion rate if we have duration
    let completionRate: number | undefined;
    if (videoDuration && finalPosition) {
      const durationParts = videoDuration.split(':').map(Number);
      const durationSeconds = durationParts.length === 2 
        ? durationParts[0] * 60 + durationParts[1]
        : durationParts.length === 3
        ? durationParts[0] * 3600 + durationParts[1] * 60 + durationParts[2]
        : finalPosition;
      
      completionRate = Math.min((finalPosition / durationSeconds) * 100, 100);
    }
    
    const activityId = await recordActivity({
      childId,
      approvedVideoId,
      youtubeId,
      activityType: 'COMPLETE',
      watchTimeSeconds: Math.round(totalWatchTime),
      videoPosition: finalPosition || 0,
      videoTitle,
      channelName,
      videoDuration,
      completed: true,
      completionRate,
    });

    // Reset watch time tracking
    watchTimeRef.current = 0;
    
    return activityId;
  }, [recordActivity, stopWatchTracking]);

  // Track video exit (left before completion)
  const trackVideoExit = useCallback(async (
    childId: string,
    youtubeId: string,
    videoTitle: string,
    channelName: string,
    position: number,
    videoDuration?: string,
    approvedVideoId?: string
  ) => {
    const watchTime = stopWatchTracking(position);
    const totalWatchTime = watchTimeRef.current + watchTime;
    
    // Calculate completion rate
    let completionRate: number | undefined;
    if (videoDuration && position > 0) {
      const durationParts = videoDuration.split(':').map(Number);
      const durationSeconds = durationParts.length === 2 
        ? durationParts[0] * 60 + durationParts[1]
        : durationParts.length === 3
        ? durationParts[0] * 3600 + durationParts[1] * 60 + durationParts[2]
        : position;
      
      completionRate = Math.min((position / durationSeconds) * 100, 100);
    }
    
    const activityId = await recordActivity({
      childId,
      approvedVideoId,
      youtubeId,
      activityType: 'EXIT',
      watchTimeSeconds: Math.round(totalWatchTime),
      videoPosition: position,
      videoTitle,
      channelName,
      videoDuration,
      completed: false,
      completionRate,
    });

    // Reset watch time tracking
    watchTimeRef.current = 0;
    
    return activityId;
  }, [recordActivity, stopWatchTracking]);

  // Clean up session on unmount
  useEffect(() => {
    return () => {
      if (isTrackingSession) {
        endSession();
      }
    };
  }, [isTrackingSession, endSession]);

  return {
    sessionId,
    isTrackingSession,
    startSession,
    endSession,
    trackVideoClick,
    trackVideoPlay,
    trackVideoPause,
    trackVideoComplete,
    trackVideoExit,
    recordActivity,
  };
};