import { Platform } from 'react-native';

interface DeduplicationEntry {
  promise: Promise<any>;
  timestamp: number;
  ttl: number;
}

class RequestDeduplication {
  private requests = new Map<string, DeduplicationEntry>();
  private readonly cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 30 seconds
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 30000);
  }

  generateKey(method: string, url: string, body?: string, userId?: string): string {
    const data = JSON.stringify({ 
      method: method.toUpperCase(), 
      url: url.toLowerCase(), 
      body: body || '', 
      userId: userId || '' 
    });
    
    // Simple hash function for React Native compatibility
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  async deduplicate<T>(
    key: string,
    requestFn: () => Promise<T>,
    ttlMs: number = 5 * 60 * 1000 // 5 minutes default
  ): Promise<T> {
    const now = Date.now();
    const existing = this.requests.get(key);

    // Return existing request if still valid
    if (existing && now - existing.timestamp < existing.ttl) {
      console.log('🔄 Request deduplication: Using cached request for key:', key);
      return existing.promise as Promise<T>;
    }

    console.log('🚀 Request deduplication: Creating new request for key:', key);
    
    // Create new request
    const promise = requestFn().finally(() => {
      // Clean up after request completes
      setTimeout(() => {
        this.requests.delete(key);
      }, 1000); // Keep for 1 second after completion to handle race conditions
    });

    // Store the request
    this.requests.set(key, {
      promise,
      timestamp: now,
      ttl: ttlMs
    });

    return promise;
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.requests.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      console.log('🧹 Request deduplication: Cleaning up expired key:', key);
      this.requests.delete(key);
    });
  }

  clear(): void {
    this.requests.clear();
  }

  getStats(): { activeRequests: number; totalKeys: number } {
    return {
      activeRequests: this.requests.size,
      totalKeys: this.requests.size
    };
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// Global instance for the mobile app
export const requestDeduplication = new RequestDeduplication();

export default requestDeduplication;