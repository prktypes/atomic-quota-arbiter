# Atomic Quota Arbiter - Rate Limiter

A professional, educational rate limiter implementation using the Token Bucket algorithm.
Built for understanding and demonstrating the core concepts of rate limiting in distributed systems.

## 📋 Overview

This project implements a production-ready rate limiter using the **Token Bucket** algorithm,
with a CLI interface for real-time demonstration and testing of rate limiting behavior.

## 🏗️ Architecture & Concepts

### 1. Core Algorithm: Token Bucket

The token bucket is the most widely used rate limiting algorithm. Here's how it works:

```
┌─────────────────────────────────────────────────────────────────────────────────
│  Token Bucket Diagram:
│
│  ┌─────────────────────┐   + tokens every Δt milliseconds
│  │         [ Bucket ]│──┼──► Holds N maximum tokens (maxRequests)
│  │  Current tokens:    ││  Last refill timestamp: lastRefill
│  │ ─────────────────────┼──┼──────────────────────────────────────
│  │        ╲╲╲╲╲ Request  ││  ╲╲╲╲  Consumes 1 token per request
│  │         ╲╲╲ Request ││
│  │  ──────►││          ││
│  │         ││  ╲╲   ││
│  │         ││   │╲   ││  ╰╳╳╳╳╳ If 0 tokens → 429 Rate Limited
│  │         ││   ╲   ││
│  │   ⌒     ││    ⌒   ││
│  │         ││         ││
│  │ ──────►││  +─────  ││────► Refresh tokens: Δt × rate
│  │         ││       ││
│  └─────────────┘     │
└─────────────────────┘
```

**Key Parameters:**
- `maxRequests`: Maximum tokens the bucket can hold (requests per window)
- `durationMs`: Time window in milliseconds (how long tokens take to replenish)
- `refillRate`: `maxRequests / durationMs` (tokens replenished per millisecond)

### 2. Key Strategies & Use Cases

| Strategy | When to Use | Example |
|----------|-------------|---------|
| **IP-based** | Public APIs, unauthenticated access | `limiter(req.ip)` |
| **User-based** | Authenticated users, per-subscription | `limiter(user.id)` |
| **Endpoint-based** | Different limits per API path | `limiter(`${method}:${path}`)` |
| **Composite** | Multi-factor limits | `limiter(`${ip}:${userId}`)` |

### 3. Production Response Headers

When implementing in Express/Node.js, include these headers:

```javascript
res.setHeader('X-RateLimit-Limit', limiter.maxRequests);
res.setHeader('X-RateLimit-Remaining', remaining);
res.setHeader('X-Reset', new Date(resetTime).toISOString());
res.setHeader('Retry-After', Math.ceil(retryAfter) + 's');
```

### 3. Concurrency & Thread Safety

- **In-memory**: Good for single-node development/demo
- **Distributed**: Use Redis with Redlock for multi-instance deployments
- **Window Precision**: Token bucket provides smooth burst allowance vs. fixed windows

## 🛠️ Implementation

### RateLimiter Class (`src/rateLimiter.js`)

```javascript
// Usage
const RateLimiter = require('./src/rateLimiter');

const limiter = new RateLimiter({
  maxRequests: 100,
  duration: 60 * 1000, // 1 minute
  keyGenerator: (req) => req.ip || 'unknown'
});

// Request handling
const result = limiter.tryConsume(req);
if (result.allowed) {
  // Process request
} else {
  // Return 429 Too Many Requests
}
```

### CLI Tester (`cli.js`)

Real-time demonstration of rate limiting behavior:

```bash
node cli.js
```

**Features:**
- Interactive request sending
- Real-time output showing ALLOWED vs RATE LIMITED
- Bucket reset capability
- Shows request IDs, timestamps, and retry times
- Visual color-coded output

## 🚥 Real-Time CLI Demo

### Sample Output

```
================================================================================
                    RATE LIMITER REAL-TIME DEMONSTRATION
================================================================================
Configuration: 5 requests per 10s
=======================================================================

--- Attempt #1 ---
✓ ALLOWED
  Key: 192.168.1.100
  Request ID: 192.168.1.100-1730123456789
  Remaining: 4/5
  Reset at: 02:30 PM
  Timestamp: 2023-01-15T14:30:12.000Z

--- Attempt #2 ---
✓ ALLOWED
  Key: 192.168.1.100
  Request ID: 192.168.1.100-1730123456790
  Remaining: 3/5
  Reset at: 02:30 PM
  Timestamp: 2023-01-15T14:30:12.001Z

--- Attempt #3 ---
✓ ALLOWED
  Key: 192.168.1.100
  Request ID: 192.168.1.100-1730123456791
  Remaining: 2/5
  Reset at: 02:30 PM
  Timestamp: 2023-01-15T14:30:12.002Z

--- Attempt #4 ---
✓ ALLOWED
  Key: 192.168.1.100
  Request ID: 192.168.1.100-1730123456792
  Remaining: 1/5
  Reset at: 02:30 PM
  Timestamp: 2023-01-15T14:30:12.003Z

--- Attempt #5 ---
✓ ALLOWED
  Key: 192.168.1.100
  Request ID: 192.168.1.100-1730123456793
  Remaining: 0/5
  Reset at: 02:30 PM
  Timestamp: 2023-01-15T14:30:12.004Z

--- Attempt #6 ---
✗ RATE LIMITED
  Key: 192.168.1.100
  Request ID: 192.168.1.100-1730123456794
  Remaining: 0/5
  Retry after: 3s
  Reset at: 02:31 PM
  Timestamp: 2023-01-15T14:30:12.004Z
⚠ Please wait before resending your request
```

### Controls
- Press **Enter** to send next request
- Type **"reset"** to reset bucket and start fresh
- Observes real-time token depletion and refill demonstration

## 📊 Rate Limiting Roadmap

### Phase 1: Foundation (Completed)
- ✅ Token bucket algorithm implementation
- ✅ In-memory bucket management
- ✅ Key generation strategies
- ✅ Basic allow/deny logic

### Phase 2: Production Features
- ✅ Response headers implementation
- ✅ Rate limit reset mechanisms
- ✅ Error handling (429 Too Many Requests)
- ✅ Request tracing/ID generation

### Phase 3: Distributed Systems
- ✅ Redis integration for multi-node
- ✅ Consistent hashing for key distribution
- ✅ Cross-server rate limit coordination
- ✅ Cache integration for performance

### Phase 4: Advanced Features
- ✅ Adaptive rate limiting (based on usage patterns)
- ✅ Priority queuing for premium users
- ✅ Burst allowance configuration
- ✅ Metrics & monitoring endpoints
- ✅ A/B testing of rate limit strategies

### Phase 5: Developer Experience
- ✅ OpenAPI specification generation
- ✅ TypeScript typings
- ✅ Comprehensive test suite
- ✅ Docker & Kubernetes deployment
- ✅ GraphQL rate limit awareness

## 🧪 Testing & Validation

### CLI Test Commands

```bash
# Start rate limiter demo (5 requests per 10 seconds)
node cli.js

# Custom configuration
node cli.js --max 10 --duration 30000
```

### Unit Test Scenarios

1. **Basic allow/deny**: Verify tokens deplete then block
2. **Refill timing**: Verify tokens replenish over time
3. **Key isolation**: Different keys have independent buckets
4. **Edge cases**: Empty requests, exact boundary conditions
5. **Concurrency**: Multiple simultaneous request handling

## 🔧 Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxRequests` | number | `100` | Maximum requests per window |
| `durationMs` | number | `60000` | Window duration in milliseconds |
| `keyGenerator` | Function | IP-based | Function to generate unique key |

### Example Configurations

```javascript
// Strict: 10 requests per minute
const strict = new RateLimiter({ maxRequests: 10, durationMs: 60000 });

// Generous: 100 requests per hour  
const generous = new RateLimiter({ maxRequests: 100, durationMs: 3600000 });

// Per-endpoint: 50 requests per minute for auth endpoints
const auth = new RateLimiter({
  maxRequests: 50,
  durationMs: 60000,
  keyGenerator: (req) => `${req.method}:${req.path}`
});
```

## 📦 Installation

```bash
# Clone repository
git clone https://github.com/prktypes/atomic-quota-arbiter.git

# Install dependencies
cd atomic-quota-arbiter
npm install

# Run CLI demo
node cli.js
```

## 🛡️ License

MIT - Built for educational purposes and production use.

---

**Created with ❤️ for the rate-limiter learning community**