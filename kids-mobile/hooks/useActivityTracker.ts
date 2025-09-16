import { useState, useRef, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useAuth } from '@clerk/clerk-expo';
import { useSession } from '@/contexts/SessionContext';
import { localActivityStorage } from '@/lib/localActivityStorage';

export type ActivityType = 'CLICK' | 'PLAY' | 'PAUSE' | 'RESUME' | 'SEEK' | 'COMPLETE' | 'EXIT';

interface VideoActivityData {
  childId: string;
  childName: string;
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
  childName: string;
  deviceInfo?: string;
  appVersion?: string;
  platform?: string;
}

export const useActivityTracker = () => {
  const watchTimeRef = useRef<number>(0);
  const lastPositionRef = useRef<number>(0);
  const watchStartTimeRef = useRef<number | null>(null);

  // Get authentication token and user ID from Clerk
  const { getToken, userId } = useAuth();

  // Use shared session context
  const { sessionId, isSessionActive, startSession, endSession, getSessionId } = useSession();

  // Device and app information
  const deviceInfo = `${Device.brand || 'Unknown'} ${Device.modelName || 'Device'} - ${Platform.OS} ${Platform.Version}`;
  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const platform = Platform.OS;

  // Session management is now handled by SessionContext

  // Record video activity to local storage
  const recordActivity = useCallback(async (activityData: VideoActivityData) => {
    try {
      const payload = {
        ...activityData,
        sessionId: getSessionId() || undefined,
        deviceInfo,
        appVersion,
        watchTimeSeconds: activityData.watchTimeSeconds || 0,
        videoPosition: activityData.videoPosition || 0,
        completed: activityData.completed || false,
      };

      console.log('📊 Recording activity to local storage:', payload);

      const savedActivity = await localActivityStorage.saveActivity(payload, userId || undefined);
      console.log('✅ Activity recorded successfully:', savedActivity.id);
      return { success: true, activityId: savedActivity.id };
    } catch (error) {
      console.error('Error recording activity:', error);
      return null;
    }
  }, [deviceInfo, appVersion, getSessionId, userId]);

  // Track video click
  const trackVideoClick = useCallback(async (
    childId: string,
    childName: string,
    youtubeId: string,
    videoTitle: string,
    channelName: string,
    approvedVideoId?: string
  ) => {
    return recordActivity({
      childId,
      childName,
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
    childName: string,
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
      childName,
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
    childName: string,
    youtubeId: string,
    videoTitle: string,
    channelName: string,
    position: number,
    approvedVideoId?: string
  ) => {
    const watchTime = stopWatchTracking(position);
    
    return recordActivity({
      childId,
      childName,
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
    childName: string,
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
      childName,
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
    childName: string,
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
      childName,
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

  return {
    sessionId,
    isSessionActive,
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