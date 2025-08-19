import { useState, useEffect, useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface ApiCacheOptions {
  cacheTimeMs?: number;
  staleWhileRevalidate?: boolean;
  retryOnError?: boolean;
  maxRetries?: number;
}

interface ApiCacheState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  lastFetched: number | null;
}

// Global cache storage
const globalCache = new Map<string, CacheEntry<any>>();

// Cleanup expired entries every 5 minutes
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  for (const [key, entry] of globalCache.entries()) {
    if (now > entry.expiresAt) {
      keysToDelete.push(key);
    }
  }
  
  keysToDelete.forEach(key => {
    globalCache.delete(key);
  });
  
  if (keysToDelete.length > 0) {
    console.log(`🧹 API Cache: Cleaned up ${keysToDelete.length} expired entries`);
  }
}, 5 * 60 * 1000);

export function useApiCache<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  options: ApiCacheOptions = {}
) {
  const {
    cacheTimeMs = 5 * 60 * 1000, // 5 minutes default
    staleWhileRevalidate = true,
    retryOnError = true,
    maxRetries = 3
  } = options;

  const [state, setState] = useState<ApiCacheState<T>>({
    data: null,
    loading: true,
    error: null,
    lastFetched: null
  });

  const retryCountRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const updateState = useCallback((update: Partial<ApiCacheState<T>>) => {
    if (isMountedRef.current) {
      setState(prev => ({ ...prev, ...update }));
    }
  }, []);

  const fetchData = useCallback(async (forceRefresh = false): Promise<T | null> => {
    const now = Date.now();
    const cached = globalCache.get(cacheKey);

    // Return cached data if available and not expired (unless forcing refresh)
    if (!forceRefresh && cached && now < cached.expiresAt) {
      console.log('📦 API Cache: Using cached data for key:', cacheKey);
      updateState({
        data: cached.data,
        loading: false,
        error: null,
        lastFetched: cached.timestamp
      });
      return cached.data;
    }

    // If we have stale data and staleWhileRevalidate is enabled, return stale data first
    if (staleWhileRevalidate && cached && cached.data) {
      console.log('⚡ API Cache: Returning stale data while revalidating for key:', cacheKey);
      updateState({
        data: cached.data,
        loading: true, // Still show loading for the revalidation
        error: null,
        lastFetched: cached.timestamp
      });
    } else {
      updateState({ loading: true, error: null });
    }

    try {
      console.log('🌐 API Cache: Fetching fresh data for key:', cacheKey);
      const data = await fetchFn();
      
      // Cache the new data
      globalCache.set(cacheKey, {
        data,
        timestamp: now,
        expiresAt: now + cacheTimeMs
      });

      updateState({
        data,
        loading: false,
        error: null,
        lastFetched: now
      });

      retryCountRef.current = 0; // Reset retry count on success
      return data;
      
    } catch (error) {
      console.error('❌ API Cache: Fetch error for key:', cacheKey, error);
      
      const err = error instanceof Error ? error : new Error('Unknown error');
      
      // If we have cached data (even if stale), use it on error
      if (cached && cached.data) {
        console.log('🔄 API Cache: Using stale data due to fetch error for key:', cacheKey);
        updateState({
          data: cached.data,
          loading: false,
          error: err,
          lastFetched: cached.timestamp
        });
        return cached.data;
      }

      // Retry logic
      if (retryOnError && retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        console.log(`🔄 API Cache: Retrying fetch (${retryCountRef.current}/${maxRetries}) for key:`, cacheKey);
        
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, retryCountRef.current - 1) * 1000;
        setTimeout(() => {
          fetchData(forceRefresh);
        }, delay);
        
        return null;
      }

      updateState({
        data: null,
        loading: false,
        error: err,
        lastFetched: null
      });
      
      return null;
    }
  }, [cacheKey, fetchFn, cacheTimeMs, staleWhileRevalidate, retryOnError, maxRetries, updateState]);

  // Initial fetch on mount or cache key change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  const clearCache = useCallback(() => {
    globalCache.delete(cacheKey);
    console.log('🗑️ API Cache: Cleared cache for key:', cacheKey);
  }, [cacheKey]);

  return {
    ...state,
    refresh,
    clearCache,
    isStale: () => {
      const cached = globalCache.get(cacheKey);
      return cached ? Date.now() > cached.expiresAt : true;
    }
  };
}

// Utility function to clear all cache
export function clearAllCache() {
  globalCache.clear();
  console.log('🗑️ API Cache: Cleared all cache entries');
}

// Utility function to get cache stats
export function getCacheStats() {
  const now = Date.now();
  let validEntries = 0;
  let expiredEntries = 0;

  for (const entry of globalCache.values()) {
    if (now < entry.expiresAt) {
      validEntries++;
    } else {
      expiredEntries++;
    }
  }

  return {
    totalEntries: globalCache.size,
    validEntries,
    expiredEntries
  };
}

// Cleanup function for app shutdown
export function destroyApiCache() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }
  globalCache.clear();
}