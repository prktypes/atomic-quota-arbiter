// Simple Rate Limiter with CLI Tester
// ====================================
// Implements the Token Bucket algorithm for rate limiting
// Includes CLI for real-time demonstration of rate limiting

/**
 * RateLimiter - Token Bucket Implementation
 * -----------------------------------------
 * Core Concepts:
 * 1. Token Bucket Algorithm:
 *    - A bucket holds N tokens (maximum requests)
 *    - Tokens are added at a fixed rate (refill rate)
 *   - Each request consumes one token
 *    - If no tokens available, request is rate-limited (429)
 *
 * 2. Key Strategies:
 *    - IP-based: Rate limit per client IP address
 *    - User-based: Rate limit per authenticated user ID
 *    - Endpoint-based: Different limits for different endpoints
 *    - Composite: Combination of multiple factors
 *
 * 3. Response Headers (Production):
 *    - X-RateLimit-Limit: Maximum requests allowed
 *    - X-RateLimit-Remaining: Remaining requests in window
 *    - X-Reset: Timestamp when bucket resets
 *    - Retry-After: Seconds to wait before retrying
 */

class RateLimiter {
  /**
   * Create a new rate limiter
   * @param {Object} options
   * @param {number} options.maxRequests - Maximum requests per window
   * @param {number} options.durationMs - Window duration in milliseconds
   * @param {Function} options.keyGenerator - Function to generate unique key
   */
  constructor({ maxRequests, durationMs, keyGenerator } = {}) {
    if (maxRequests <= 0 || durationMs <= 0) {
      throw new Error('maxRequests and durationMs must be positive');
    }
    
    this.maxRequests = maxRequests;
    this.durationMs = durationMs;
    this.keyGenerator = keyGenerator || ((req) => req.ip || 'unknown');
    this.buckets = new Map();
    
    console.log(`✓ RateLimiter initialized: ${maxRequests} requests/${durationMs/1000}s`);
  }

  /**
   * Generate rate limit key from request
   * @param {Object} req - Express request object
   * @returns {string} Unique identifier key
   */
  generateKey(req) {
    return this.keyGenerator(req);
  }

  /**
   * Core - Token Bucket Algorithm
   * @param {Object} req - Request object
   * @returns {Object} Rate limit result
   */
  tryConsume(req) {
    const key = this.generateKey(req);
    const now = Date.now();
    
    // Get or create bucket for this key
    if (!this.buckets.has(key)) {
      this.buckets.set(key, {
        tokens: this.maxRequests,
        lastRefill: now,
      });
    }
    
    const bucket = this.buckets.get(key);
    
    // Refill tokens based on elapsed time
    const elapsed = now - bucket.lastRefill;
    const refillRate = this.maxRequests / this.durationMs; // tokens per ms
    
    const newTokens = Math.floor(elapsed * refillRate);
    if (newTokens > 0) {
      bucket.tokens = Math.min(this.maxRequests, bucket.tokens + newTokens);
      bucket.lastRefill = now;
    }
    
    // Check if request allowed
    if (bucket.tokens > 0) {
      bucket.tokens -= 1;
      return {
        allowed: true,
        remaining: Math.floor(bucket.tokens),
        resetTime: bucket.lastRefill + this.durationMs,
        key,
        // Simulated request metadata for CLI display
        requestId: `${key}-${Date.now()}`,
        timestamp: new Date().toISOString(),
      };
    }
    
    return {
      allowed: false,
      remaining: 0,
      resetTime: bucket.lastRefill + this.durationMs,
      key,
      // Rate limit exceeded - useful for CLI display
      requestId: `${key}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      retryAfter: Math.ceil((bucket.lastRefill + this.durationMs - now) / 1000),
    };
  }

  /**
   * Reset bucket for testing
   * @param {Object} req - Request object
   */
  resetKey(req) {
    const key = this.generateKey(req);
    this.buckets.delete(key);
  }

  /**
   * Reset all buckets
   */
  resetAll() {
    this.buckets.clear();
  }

  /**
   * Get current state for all active keys
   * @returns {Map} Buckets state
   */
  getState() {
    return this.buckets;
  }

  /**
   * Format rate limit info for CLI display
   * @param {boolean} allowed - Whether request was allowed
   * @param {Object} result - Rate limiter result
   * @returns {string} Formatted display string
   */
  static formatResult(allowed, result) {
    const colorGreen = '\x1b[32m';
    const colorRed = '\x1b[31m';
    const colorReset = '\x1b[0m';
    const bold = '\x1b[1m';
    
    if (allowed) {
      return `
${colorGreen}${bold}✓ ALLOWED${colorReset}${colorReset}
  Key: ${result.key}
  Request ID: ${result.requestId}
  Remaining: ${result.remaining}/${result.maxRequests}
  Reset at: ${new Date(result.resetTime).toLocaleTimeString()}
  Timestamp: ${result.timestamp}
`.trim();
    } else {
      return `
${colorRed}${bold}✗ RATE LIMITED${colorReset}${colorReset}
  Key: ${result.key}
  Request ID: ${result.requestId}
  Remaining: ${result.remaining}/${result.maxRequests}
  Retry after: ${result.retryAfter}s
  Reset at: ${new Date(result.resetTime).toLocaleTimeString()}
  Timestamp: ${result.timestamp}
${colorRed}⚠ Please wait before resending your request${colorReset}
`.trim();
    }
  }
}

module.exports = RateLimiter;