/**
 * YouTube API Quota Management System
 * Daily limit: 10,000 units
 * Target: Support 50+ users efficiently
 */

interface QuotaUsage {
  userId: string;
  date: string;
  searchCalls: number; // 100 units each
  videoCalls: number;  // 1 unit each
  totalUnits: number;
}

interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
}

class YouTubeQuotaManager {
  private dailyUsage: Map<string, QuotaUsage> = new Map();
  private globalCache: Map<string, CacheEntry> = new Map();

  // Quota limits per user per day
  private readonly MAX_SEARCHES_PER_USER_PER_DAY = 15; // 1,500 units max per user
  private readonly MAX_TOTAL_DAILY_UNITS = 9000; // Leave 1000 units buffer
  private readonly CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours

  constructor() {
    // Clean up old data daily
    this.setupDailyCleanup();
  }

  /**
   * Check if user can make API call
   */
  async canMakeApiCall(userId: string, callType: 'search' | 'video'): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];
    const userKey = `${userId}-${today}`;

    const usage = this.dailyUsage.get(userKey) || {
      userId,
      date: today,
      searchCalls: 0,
      videoCalls: 0,
      totalUnits: 0
    };

    // Check user limits
    if (callType === 'search' && usage.searchCalls >= this.MAX_SEARCHES_PER_USER_PER_DAY) {
      console.log(`🚫 User ${userId} exceeded daily search limit`);
      return false;
    }

    // Check global quota
    const totalGlobalUsage = Array.from(this.dailyUsage.values())
      .filter(u => u.date === today)
      .reduce((sum, u) => sum + u.totalUnits, 0);

    const unitsNeeded = callType === 'search' ? 100 : 1;
    if (totalGlobalUsage + unitsNeeded > this.MAX_TOTAL_DAILY_UNITS) {
      console.log(`🚫 Global daily quota would be exceeded`);
      return false;
    }

    return true;
  }

  /**
   * Record API call usage
   */
  async recordApiCall(userId: string, callType: 'search' | 'video'): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const userKey = `${userId}-${today}`;

    const usage = this.dailyUsage.get(userKey) || {
      userId,
      date: today,
      searchCalls: 0,
      videoCalls: 0,
      totalUnits: 0
    };

    if (callType === 'search') {
      usage.searchCalls++;
      usage.totalUnits += 100;
    } else {
      usage.videoCalls++;
      usage.totalUnits += 1;
    }

    this.dailyUsage.set(userKey, usage);
    console.log(`📊 User ${userId} quota: ${usage.totalUnits} units used today`);
  }

  /**
   * Get cached data if available
   */
  getFromCache(cacheKey: string): any | null {
    const entry = this.globalCache.get(cacheKey);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.globalCache.delete(cacheKey);
      return null;
    }

    console.log('✅ Cache hit for:', cacheKey);
    return entry.data;
  }

  /**
   * Store data in cache
   */
  setCache(cacheKey: string, data: any, customTTL?: number): void {
    const ttl = customTTL || this.CACHE_DURATION;
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl
    };

    this.globalCache.set(cacheKey, entry);
    console.log('💾 Cached data for:', cacheKey);
  }

  /**
   * Generate cache key for requests
   */
  generateCacheKey(query: string, maxResults: number, filters?: any): string {
    const filterStr = filters ? JSON.stringify(filters) : '';
    return `yt-search-${query}-${maxResults}-${filterStr}`;
  }

  /**
   * Get user quota status
   */
  getUserQuotaStatus(userId: string): {
    searchesUsed: number;
    searchesRemaining: number;
    unitsUsed: number;
    canMakeRequests: boolean;
  } {
    const today = new Date().toISOString().split('T')[0];
    const userKey = `${userId}-${today}`;

    const usage = this.dailyUsage.get(userKey) || {
      userId,
      date: today,
      searchCalls: 0,
      videoCalls: 0,
      totalUnits: 0
    };

    return {
      searchesUsed: usage.searchCalls,
      searchesRemaining: Math.max(0, this.MAX_SEARCHES_PER_USER_PER_DAY - usage.searchCalls),
      unitsUsed: usage.totalUnits,
      canMakeRequests: usage.searchCalls < this.MAX_SEARCHES_PER_USER_PER_DAY
    };
  }

  /**
   * Get global quota status
   */
  getGlobalQuotaStatus(): {
    totalUnitsUsed: number;
    totalUnitsRemaining: number;
    activeUsers: number;
  } {
    const today = new Date().toISOString().split('T')[0];
    const todayUsages = Array.from(this.dailyUsage.values())
      .filter(u => u.date === today);

    const totalUnitsUsed = todayUsages.reduce((sum, u) => sum + u.totalUnits, 0);

    return {
      totalUnitsUsed,
      totalUnitsRemaining: Math.max(0, this.MAX_TOTAL_DAILY_UNITS - totalUnitsUsed),
      activeUsers: todayUsages.length
    };
  }

  /**
   * Setup daily cleanup
   */
  private setupDailyCleanup(): void {
    setInterval(() => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Clean old usage data
      for (const [key, usage] of this.dailyUsage.entries()) {
        if (usage.date < yesterdayStr) {
          this.dailyUsage.delete(key);
        }
      }

      // Clean expired cache
      for (const [key, entry] of this.globalCache.entries()) {
        if (Date.now() > entry.expiresAt) {
          this.globalCache.delete(key);
        }
      }

      console.log('🧹 Daily cleanup completed');
    }, 24 * 60 * 60 * 1000); // Run daily
  }
}

export const quotaManager = new YouTubeQuotaManager();
export default quotaManager;





