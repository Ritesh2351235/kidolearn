interface ThrottleEntry {
  count: number;
  resetTime: number;
}

interface ThrottleConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (userId?: string) => string;
}

export class RequestThrottle {
  private requests = new Map<string, ThrottleEntry>();
  private readonly config: ThrottleConfig;
  private readonly cleanupInterval: NodeJS.Timeout;

  constructor(config: ThrottleConfig) {
    this.config = {
      keyGenerator: (userId) => userId || 'anonymous',
      ...config
    };

    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  async checkAndIncrement(userId?: string): Promise<{ allowed: boolean; retryAfter?: number }> {
    const key = this.config.keyGenerator!(userId);
    const now = Date.now();
    const existing = this.requests.get(key);

    // If no existing entry or window has expired, create new entry
    if (!existing || now >= existing.resetTime) {
      this.requests.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs
      });
      return { allowed: true };
    }

    // If within window, check if under limit
    if (existing.count < this.config.maxRequests) {
      existing.count++;
      return { allowed: true };
    }

    // Rate limit exceeded
    const retryAfter = Math.ceil((existing.resetTime - now) / 1000);
    console.log(`🚫 Rate limit exceeded for key: ${key}. Retry after: ${retryAfter}s`);
    
    return { 
      allowed: false, 
      retryAfter 
    };
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.requests.entries()) {
      if (now >= entry.resetTime) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      this.requests.delete(key);
    });

    if (keysToDelete.length > 0) {
      console.log(`🧹 Throttle cleanup: Removed ${keysToDelete.length} expired entries`);
    }
  }

  getStats(): { activeWindows: number; totalRequests: number } {
    let totalRequests = 0;
    for (const entry of this.requests.values()) {
      totalRequests += entry.count;
    }

    return {
      activeWindows: this.requests.size,
      totalRequests
    };
  }

  clear(): void {
    this.requests.clear();
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// Pre-configured throttle instances for different endpoints
export const recommendationsThrottle = new RequestThrottle({
  windowMs: 60 * 1000, // 1 minute window
  maxRequests: 5, // Max 5 recommendation requests per minute per user
});

export const videosThrottle = new RequestThrottle({
  windowMs: 30 * 1000, // 30 second window
  maxRequests: 10, // Max 10 video-related requests per 30 seconds per user
});

export const approvalThrottle = new RequestThrottle({
  windowMs: 60 * 1000, // 1 minute window
  maxRequests: 20, // Max 20 video approvals per minute per user
});

export const searchThrottle = new RequestThrottle({
  windowMs: 30 * 1000, // 30 second window
  maxRequests: 8, // Max 8 searches per 30 seconds per user
});

// Helper function to create rate limit error response
export function createRateLimitResponse(retryAfter: number) {
  return {
    error: 'Rate limit exceeded',
    message: `Too many requests. Please wait ${retryAfter} seconds before trying again.`,
    retryAfter,
    status: 429
  };
}

// Helper function to add rate limit headers
export function addRateLimitHeaders(response: Response, retryAfter?: number) {
  if (retryAfter) {
    response.headers.set('Retry-After', retryAfter.toString());
  }
  response.headers.set('X-RateLimit-Policy', 'YouTube API quota preservation');
  return response;
}