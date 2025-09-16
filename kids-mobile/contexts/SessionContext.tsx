import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { localActivityStorage } from '@/lib/localActivityStorage';

interface SessionContextType {
  sessionId: string | null;
  isSessionActive: boolean;
  startSession: (childId: string, childName: string) => Promise<string | null>;
  endSession: (childId?: string, childName?: string) => Promise<void>;
  getSessionId: () => string | null;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const { getToken } = useAuth();

  // Device and app information
  const deviceInfo = `${Device.brand || 'Unknown'} ${Device.modelName || 'Device'} - ${Platform.OS} ${Platform.Version}`;
  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const platform = Platform.OS;

  const startSession = async (childId: string, childName: string): Promise<string | null> => {
    try {
      // Generate a unique session ID
      const newSessionId = `mobile-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      // Save session to local storage
      await localActivityStorage.saveSession({
        childId,
        childName,
        sessionId: newSessionId,
        startTime: new Date().toISOString(),
        videosClicked: 0,
        videosWatched: 0,
        totalWatchTime: 0,
        deviceInfo,
        appVersion,
        platform
      });

      setSessionId(newSessionId);
      setIsSessionActive(true);
      console.log('✅ Global session started in local storage:', newSessionId);
      return newSessionId;
    } catch (error) {
      console.error('Error starting global session:', error);
      return null;
    }
  };

  const endSession = async (childId?: string, childName?: string): Promise<void> => {
    if (!sessionId) return;

    try {
      if (childId) {
        // Update session with end time and duration
        const endTime = new Date().toISOString();
        const sessions = await localActivityStorage.getSessions();
        const currentSession = sessions.find(s => s.sessionId === sessionId);
        
        if (currentSession) {
          const startTime = new Date(currentSession.startTime);
          const duration = Math.floor((Date.now() - startTime.getTime()) / 1000);
          
          await localActivityStorage.updateSession(sessionId, {
            endTime,
            duration
          });
          
          console.log('✅ Global session ended in local storage:', sessionId);
        }
      }

      setSessionId(null);
      setIsSessionActive(false);
    } catch (error) {
      console.error('Error ending global session:', error);
      setSessionId(null);
      setIsSessionActive(false);
    }
  };

  const getSessionId = (): string | null => {
    return sessionId;
  };

  // Clean up session on unmount
  useEffect(() => {
    return () => {
      if (isSessionActive && sessionId) {
        // Don't await this in the cleanup
        endSession().catch(console.error);
      }
    };
  }, [isSessionActive, sessionId]);

  const value: SessionContextType = {
    sessionId,
    isSessionActive,
    startSession,
    endSession,
    getSessionId,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextType {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}