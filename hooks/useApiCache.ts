import { useState, useRef, useCallback } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface RequestState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useApiCache<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  cacheTimeMs = 5 * 60 * 1000 // 5 minutes default
) {
  const cache = useRef<Map<string, CacheEntry<T>>>(new Map());
  const pendingRequests = useRef<Map<string, Promise<T>>>(new Map());
  
  const [state, setState] = useState<RequestState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const fetchData = useCallback(async (key: string, forceRefresh = false) => {
    // Check cache first (unless forcing refresh)
    if (!forceRefresh) {
      const cached = cache.current.get(key);
      if (cached && Date.now() < cached.expiresAt) {
        setState({
          data: cached.data,
          loading: false,
          error: null
        });
        return cached.data;
      }
    }

    // Check if there's already a pending request for this key
    const existingRequest = pendingRequests.current.get(key);
    if (existingRequest && !forceRefresh) {
      try {
        const data = await existingRequest;
        setState({
          data,
          loading: false,
          error: null
        });
        return data;
      } catch (error) {
        setState({
          data: null,
          loading: false,
          error: error as Error
        });
        throw error;
      }
    }

    // Set loading state
    setState(prev => ({
      ...prev,
      loading: true,
      error: null
    }));

    // Create new request
    const requestPromise = fetchFn();
    pendingRequests.current.set(key, requestPromise);

    try {
      const data = await requestPromise;
      
      // Cache the result
      const now = Date.now();
      cache.current.set(key, {
        data,
        timestamp: now,
        expiresAt: now + cacheTimeMs
      });

      setState({
        data,
        loading: false,
        error: null
      });

      return data;
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error as Error
      });
      throw error;
    } finally {
      // Clean up pending request
      pendingRequests.current.delete(key);
    }
  }, [fetchFn, cacheTimeMs]);

  const clearCache = useCallback((keyPattern?: string) => {
    if (keyPattern) {
      for (const key of cache.current.keys()) {
        if (key.includes(keyPattern)) {
          cache.current.delete(key);
        }
      }
    } else {
      cache.current.clear();
    }
  }, []);

  const refetch = useCallback(() => {
    return fetchData(cacheKey, true);
  }, [cacheKey, fetchData]);

  return {
    ...state,
    fetch: () => fetchData(cacheKey),
    refetch,
    clearCache
  };
}