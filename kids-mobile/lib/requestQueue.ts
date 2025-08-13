// Mobile-specific request deduplication and queuing

interface QueuedRequest<T> {
  id: string;
  promise: Promise<T>;
  timestamp: number;
}

class MobileRequestQueue {
  private pendingRequests = new Map<string, QueuedRequest<any>>();
  private readonly TTL = 30 * 1000; // 30 seconds TTL for mobile requests

  async execute<T>(requestId: string, requestFn: () => Promise<T>): Promise<T> {
    // Clean up expired requests
    this.cleanup();

    // Check if identical request is already pending
    const existing = this.pendingRequests.get(requestId);
    if (existing) {
      console.log('🔄 [Mobile] Reusing pending request:', requestId);
      return existing.promise;
    }

    // Create new request
    console.log('🚀 [Mobile] Starting new request:', requestId);
    const promise = requestFn();
    
    this.pendingRequests.set(requestId, {
      id: requestId,
      promise,
      timestamp: Date.now()
    });

    try {
      const result = await promise;
      return result;
    } catch (error) {
      throw error;
    } finally {
      // Clean up completed request
      this.pendingRequests.delete(requestId);
    }
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp > this.TTL) {
        this.pendingRequests.delete(key);
      }
    }
  }

  clear() {
    this.pendingRequests.clear();
  }
}

export const mobileRequestQueue = new MobileRequestQueue();