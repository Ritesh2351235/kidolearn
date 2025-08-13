// Server-side request deduplication
import crypto from 'crypto';

interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
}

class ServerRequestDeduplicator {
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes TTL for pending requests

  generateKey(method: string, url: string, body?: string, userId?: string): string {
    const data = JSON.stringify({ method, url, body, userId });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  async deduplicate<T>(
    key: string, 
    requestFn: () => Promise<T>,
    ttl: number = this.TTL
  ): Promise<T> {
    const now = Date.now();
    
    // Clean up expired requests
    for (const [k, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp > ttl) {
        this.pendingRequests.delete(k);
      }
    }

    // Check if request is already pending
    const existing = this.pendingRequests.get(key);
    if (existing) {
      console.log('🔄 Deduplicating request with key:', key.substring(0, 8) + '...');
      return existing.promise;
    }

    // Create new request
    const promise = requestFn();
    this.pendingRequests.set(key, { promise, timestamp: now });

    try {
      const result = await promise;
      return result;
    } finally {
      // Clean up completed request
      this.pendingRequests.delete(key);
    }
  }

  cleanup() {
    const now = Date.now();
    for (const [key, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp > this.TTL) {
        this.pendingRequests.delete(key);
      }
    }
  }
}

export const serverDeduplicator = new ServerRequestDeduplicator();

// Cleanup interval
setInterval(() => {
  serverDeduplicator.cleanup();
}, 2 * 60 * 1000); // Cleanup every 2 minutes