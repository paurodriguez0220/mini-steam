using System;
using System.Collections.Concurrent;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace MiniSteam.Middleware
{
    /// <summary>
    /// In-memory rate limiter that allows configurable requests per client per minute using a sliding window approach.
    /// Identifies clients by remote IP address or X-Forwarded-For header when present.
    /// Includes automatic cleanup to prevent memory leaks.
    /// Note: this is best-effort and not suitable for multi-instance deployments.
    /// </summary>
    public class RateLimitMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly int _maxRequests;
        private readonly TimeSpan _windowSize;
        private static readonly ConcurrentDictionary<string, Queue<DateTime>> _requestHistory = new();
        private static DateTime _lastCleanup = DateTime.UtcNow;
        private static readonly TimeSpan _cleanupInterval = TimeSpan.FromMinutes(10);

        public RateLimitMiddleware(RequestDelegate next, IConfiguration configuration)
        {
            _next = next ?? throw new ArgumentNullException(nameof(next));
            
            // Read configuration values with defaults
            _maxRequests = configuration.GetValue<int>("RateLimiting:MaxRequests", 100);
            var windowSeconds = configuration.GetValue<int>("RateLimiting:WindowSeconds", 60);
            _windowSize = TimeSpan.FromSeconds(windowSeconds);
            
            // Validate configuration
            if (_maxRequests <= 0)
                throw new InvalidOperationException("RateLimiting:MaxRequests must be greater than 0.");
            if (windowSeconds <= 0)
                throw new InvalidOperationException("RateLimiting:WindowSeconds must be greater than 0.");
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Skip rate limiting for safe or static endpoints to avoid extra requests (redirects, swagger, health checks, etc.)
            var path = context.Request.Path.Value ?? string.Empty;
            if (context.Request.Method == HttpMethods.Options ||
                path.Equals("/favicon.ico", StringComparison.OrdinalIgnoreCase) ||
                path.StartsWith("/swagger", StringComparison.OrdinalIgnoreCase) ||
                path.StartsWith("/openapi", StringComparison.OrdinalIgnoreCase) ||
                path.StartsWith("/api-docs", StringComparison.OrdinalIgnoreCase) ||
                path.StartsWith("/health", StringComparison.OrdinalIgnoreCase) ||   
                path.StartsWith("/scalar", StringComparison.OrdinalIgnoreCase))
            {
                await _next(context);
                return;
            }

            // Perform periodic cleanup to prevent memory leaks
            var now = DateTime.UtcNow;
            if (now - _lastCleanup > _cleanupInterval)
            {
                CleanupOldEntries(now);
                _lastCleanup = now;
            }

            var clientId = GetClientId(context);

            // Check and update request count using sliding window
            var shouldAllow = true;
            var requestsInWindow = 0;
            var oldestRequestTime = DateTime.MinValue;

            lock (_requestHistory)
            {
                // Get or create request history for this client
                var clientRequests = _requestHistory.GetOrAdd(clientId, _ => new Queue<DateTime>());

                // Remove requests outside the current window
                while (clientRequests.Count > 0 && now - clientRequests.Peek() > _windowSize)
                {
                    clientRequests.Dequeue();
                }

                requestsInWindow = clientRequests.Count;

                // Check if we're at the limit
                if (requestsInWindow >= _maxRequests)
                {
                    shouldAllow = false;
                    oldestRequestTime = clientRequests.Count > 0 ? clientRequests.Peek() : now;
                }
                else
                {
                    // Add current request to the queue
                    clientRequests.Enqueue(now);
                }
            }

            if (!shouldAllow)
            {
                // Calculate when the oldest request will expire
                var retryAfterSeconds = Math.Max(1, (_windowSize - (now - oldestRequestTime)).TotalSeconds);
                
                context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
                context.Response.Headers["Retry-After"] = Math.Ceiling(retryAfterSeconds).ToString();
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsJsonAsync(new 
                { 
                    message = $"Rate limit exceeded. Maximum {_maxRequests} requests per {_windowSize.TotalMinutes:0} minute(s) allowed.",
                    requestsInWindow = requestsInWindow,
                    maxRequests = _maxRequests,
                    windowSizeSeconds = _windowSize.TotalSeconds,
                    retryAfterSeconds = Math.Ceiling(retryAfterSeconds)
                });
                return;
            }

            await _next(context);
        }

        private static void CleanupOldEntries(DateTime now)
        {
            // Remove entries older than the cleanup interval to free memory
            var cutoff = now.Subtract(_cleanupInterval);
            
            lock (_requestHistory)
            {
                var keysToRemove = new List<string>();
                
                foreach (var kvp in _requestHistory)
                {
                    var queue = kvp.Value;
                    
                    // Remove old requests from the queue
                    while (queue.Count > 0 && now - queue.Peek() > TimeSpan.FromMinutes(5))
                    {
                        queue.Dequeue();
                    }
                    
                    // If queue is empty, mark key for removal
                    if (queue.Count == 0)
                    {
                        keysToRemove.Add(kvp.Key);
                    }
                }
                
                // Remove empty entries
                foreach (var key in keysToRemove)
                {
                    _requestHistory.TryRemove(key, out _);
                }
            }
        }

        private static string GetClientId(HttpContext context)
        {
            // Prefer X-Forwarded-For when behind proxies. Use first IP in the list.
            if (context.Request.Headers.TryGetValue("X-Forwarded-For", out var forwarded))
            {
                var first = forwarded.ToString().Split(',').Select(s => s.Trim()).FirstOrDefault();
                if (!string.IsNullOrEmpty(first)) return first;
            }

            // Fallback to RemoteIpAddress when available
            if (context.Connection.RemoteIpAddress != null)
            {
                return context.Connection.RemoteIpAddress.ToString();
            }

            // As a last resort, create a lightweight fingerprint using connection port and user-agent to avoid collapsing all clients into "unknown"
            var ua = context.Request.Headers.TryGetValue("User-Agent", out var userAgent) ? userAgent.ToString().Split(' ').FirstOrDefault() : null;
            var port = context.Connection.RemotePort;
            return $"unknown-{port}-{ua ?? "na"}";
        }
    }

    public static class RateLimitMiddlewareExtensions
    {
        public static IApplicationBuilder UseRateLimiting(this IApplicationBuilder app)
        {
            return app.UseMiddleware<RateLimitMiddleware>();
        }
    }
}
