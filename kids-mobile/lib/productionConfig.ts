/**
 * Production Configuration for App Store Deployment
 * This file handles the transition from development to production mode
 */

import { Platform } from 'react-native';

export const DEPLOYMENT_CONFIG = {
  // Set this to true when building for App Store
  IS_PRODUCTION: __DEV__ === false,

  // Production API URL - point to your deployed backend server
  PRODUCTION_API_URL: process.env.EXPO_PUBLIC_PROD_API_URL || 'https://your-domain.com',

  // Development API URL - use Expo dev server URL
  DEVELOPMENT_API_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8081',

  // Feature flags for production
  FEATURES: {
    // Enable features for production
    USE_ENHANCED_VIDEO_URLS: true, // Enable in production
    USE_VIDEO_TRACKING: true, // Always enabled
    USE_ANALYTICS_API: true, // Enable in production
    ENABLE_DEBUG_LOGS: __DEV__, // Only in development
  }
};

export const getApiBaseUrl = () => {
  if (DEPLOYMENT_CONFIG.IS_PRODUCTION) {
    return DEPLOYMENT_CONFIG.PRODUCTION_API_URL;
  }
  return DEPLOYMENT_CONFIG.DEVELOPMENT_API_URL;
};

export const shouldUseOfflineMode = () => {
  // Only use offline mode in development for testing
  return false;
};

export const logDebug = (message: string, ...args: any[]) => {
  if (DEPLOYMENT_CONFIG.FEATURES.ENABLE_DEBUG_LOGS) {
    console.log(message, ...args);
  }
};

export const logError = (message: string, ...args: any[]) => {
  // Always log errors, but less verbose in production
  if (DEPLOYMENT_CONFIG.IS_PRODUCTION) {
    console.error(message);
  } else {
    console.error(message, ...args);
  }
};
