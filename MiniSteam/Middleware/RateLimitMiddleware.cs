using System;
using System.Collections.Concurrent;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace MiniSteam.Middleware
{
    /// <summary>
    /// Simple in-memory rate limiter that allows one request per client per configured interval (default1 second).
    /// Identifies clients by remote IP address or X-Forwarded-For header when present.
    /// Note: this is best-effort and not suitable for multi-instance deployments.
    /// </summary>
    public class RateLimitMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly TimeSpan _period;
        private static readonly ConcurrentDictionary<string, DateTime> _lastRequest = new();

        public RateLimitMiddleware(RequestDelegate next, TimeSpan? period = null)
        {
            _next = next ?? throw new ArgumentNullException(nameof(next));
            _period = period ?? TimeSpan.FromSeconds(1);
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

            var clientId = GetClientId(context);
            var now = DateTime.UtcNow;

            var last = _lastRequest.GetOrAdd(clientId, DateTime.MinValue);

            // If last is too recent, reject
            if (now - last < _period)
            {
                var retryAfter = (_period - (now - last)).TotalSeconds;
                context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
                context.Response.Headers["Retry-After"] = Math.Ceiling(retryAfter).ToString();
                await context.Response.WriteAsync("Too Many Requests");
                return;
            }

            // Update last request time
            _lastRequest[clientId] = now;

            await _next(context);
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
        public static IApplicationBuilder UseRateLimiting(this IApplicationBuilder app, TimeSpan? period = null)
        {
            return app.UseMiddleware<RateLimitMiddleware>(period);
        }
    }
}
