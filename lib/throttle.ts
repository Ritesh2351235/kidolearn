// Request throttling and rate limiting utility

interface ThrottleOptions {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: any) => string;
}

class RequestThrottle {
  private requests: Map<string, number[]> = new Map();
  
  constructor(private options: ThrottleOptions) {}

  isAllowed(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.options.windowMs;
    
    // Get or create request history for this key
    let requestHistory = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    requestHistory = requestHistory.filter(timestamp => timestamp > windowStart);
    
    // Check if we've exceeded the limit
    if (requestHistory.length >= this.options.maxRequests) {
      return false;
    }
    
    // Add current request
    requestHistory.push(now);
    this.requests.set(key, requestHistory);
    
    return true;
  }

  getRemainingRequests(key: string): number {
    const now = Date.now();
    const windowStart = now - this.options.windowMs;
    
    const requestHistory = this.requests.get(key) || [];
    const recentRequests = requestHistory.filter(timestamp => timestamp > windowStart);
    
    return Math.max(0, this.options.maxRequests - recentRequests.length);
  }

  getTimeUntilReset(key: string): number {
    const requestHistory = this.requests.get(key) || [];
    if (requestHistory.length === 0) return 0;
    
    const oldestRequest = Math.min(...requestHistory);
    const resetTime = oldestRequest + this.options.windowMs;
    
    return Math.max(0, resetTime - Date.now());
  }

  cleanup() {
    const now = Date.now();
    
    for (const [key, history] of this.requests.entries()) {
      const windowStart = now - this.options.windowMs;
      const recentRequests = history.filter(timestamp => timestamp > windowStart);
      
      if (recentRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, recentRequests);
      }
    }
  }
}

// Global throttlers for different API endpoints
export const recommendationsThrottle = new RequestThrottle({
  windowMs: 60 * 1000, // 1 minute window
  maxRequests: 5, // Max 5 requests per minute per user
});

export const videosThrottle = new RequestThrottle({
  windowMs: 30 * 1000, // 30 second window
  maxRequests: 10, // Max 10 requests per 30 seconds per user
});

// Client-side request queue
class RequestQueue {
  private queue: Array<{
    id: string;
    fn: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];
  
  private processing = false;
  private lastRequestTime = 0;
  private minInterval = 1000; // Minimum 1 second between requests

  async add<T>(id: string, fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      // Check if there's already a pending request with the same ID
      const existing = this.queue.find(item => item.id === id);
      if (existing) {
        // Return the existing promise instead of creating a new request
        return existing.resolve;
      }

      this.queue.push({ id, fn, resolve, reject });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;

      // Wait if we need to throttle
      if (timeSinceLastRequest < this.minInterval) {
        await new Promise(resolve => setTimeout(resolve, this.minInterval - timeSinceLastRequest));
      }

      const request = this.queue.shift()!;
      
      try {
        this.lastRequestTime = Date.now();
        const result = await request.fn();
        request.resolve(result);
      } catch (error) {
        request.reject(error);
      }

      // Remove any duplicate requests for the same ID
      const duplicates = this.queue.filter(item => item.id === request.id);
      for (const duplicate of duplicates) {
        const index = this.queue.indexOf(duplicate);
        if (index > -1) {
          this.queue.splice(index, 1);
        }
      }
    }

    this.processing = false;
  }
}

export const requestQueue = new RequestQueue();

// Cleanup interval
setInterval(() => {
  recommendationsThrottle.cleanup();
  videosThrottle.cleanup();
}, 5 * 60 * 1000); // Cleanup every 5 minutes