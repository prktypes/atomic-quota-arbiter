// Rate Limiter CLI Tester - Real-time Demonstration
// ================================================
// Demonstrates rate limiter functionality in real-time via CLI
// Shows actual request/response flow and rate limiting behavior

const readline = require('readline');
const RateLimiter = require('./src/rateLimiter');

// Configure rate limiter
const limiter = new RateLimiter({
  maxRequests: 5,      // 5 requests per window
  durationMs: 10000, // 10 second window
  keyGenerator: (req) => {
    // Simulate IP-based key from request
    return req.clientIp || 'default-client';
  }
});

// CLI Interface setup
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Track request attempts
let attempts = 0;
const maxAttempts = 10; // Test beyond the limit

// Display header
function displayHeader() {
  console.log(`
================================================================================
                    RATE LIMITER REAL-TIME DEMONSTRATION
================================================================================
Configuration: ${limiter.maxRequests} requests per ${limiter.durationMs/1000}s
${'='.repeat(70)}
`);
}

function displayResult(allowed, result) {
  console.log(RateLimiter.formatResult(allowed, result));
}

// Main request function
function sendRequest(clientIp) {
  attempts++;
  const result = limiter.tryConsume({ clientIp });
  
  console.log(`\n--- Attempt #${attempts} ---`);
  displayResult(result.allowed, result);
  
  if (attempts < maxAttempts) {
    // Ask user if they want to continue
    console.log('\nPress Enter to send next request, or type "reset" to reset bucket');
    rl.question('', (input) => {
      if (input.toLowerCase() === 'reset') {
        limiter.resetAll();
        console.log('\n✓ Bucket reset! Starting fresh.');
        sendRequest(clientIp);
      } else {
        sendRequest(clientIp);
      }
    });
  } else {
    console.log('\n=== Rate Limiter Test Complete ===');
    console.log(`Successfully executed ${attempts} requests`);
    console.log('Closing in 3 seconds...');
    setTimeout(() => {
      process.exit(0);
    }, 3000);
  }
}

// Display initial state
displayHeader();

// Start first request
console.log('Sending first request...\n');
sendRequest('192.168.1.100');