import { getApiBaseUrl } from '../lib/productionConfig';

const BASE_URL = getApiBaseUrl();

// For mobile app, we use API routes with proper base URL
export const API_ENDPOINTS = {
  children: `${BASE_URL}/api/children`,
  parentAnalytics: `${BASE_URL}/api/parent/analytics`,
  approvedVideos: `${BASE_URL}/api/approved-videos`,
  scheduledVideos: `${BASE_URL}/api/scheduled-videos`,
};