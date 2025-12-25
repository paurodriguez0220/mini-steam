namespace MiniSteam.Middleware
{
 public class BasePathRedirectMiddleware
 {
 private readonly RequestDelegate _next;
 private readonly string? _basePath;
 private readonly bool _hasBasePath;

 public BasePathRedirectMiddleware(RequestDelegate next, IConfiguration config)
 {
 _next = next;
 _basePath = config["BasePath"] ?? Environment.GetEnvironmentVariable("BASE_PATH");
 _hasBasePath = !string.IsNullOrEmpty(_basePath);
 if (_hasBasePath && !_basePath!.StartsWith('/')) _basePath = "/" + _basePath;
 }

 public async Task InvokeAsync(HttpContext context)
 {
 // If the app is not mounted under a base path and the request is for root, redirect to /scalar
 if (!_hasBasePath && context.Request.Path == "/")
 {
 var cfg = context.RequestServices.GetService<IConfiguration>();
 var cfgBase = cfg?["BasePath"];
 var target = !string.IsNullOrEmpty(cfgBase)
 ? (cfgBase!.StartsWith('/') ? cfgBase : "/" + cfgBase)
 : "/scalar";

 var qs = context.Request.QueryString.HasValue ? context.Request.QueryString.Value : string.Empty;
 context.Response.Redirect(target + qs);
 return;
 }

 await _next(context);
 }
 }

 public static class BasePathRedirectMiddlewareExtensions
 {
 public static IApplicationBuilder UseBasePathRedirect(this IApplicationBuilder app)
 {
 var config = app.ApplicationServices.GetService<IConfiguration>();
 var basePath = config?["BasePath"] ?? Environment.GetEnvironmentVariable("BASE_PATH");
 if (!string.IsNullOrEmpty(basePath) && !basePath.StartsWith('/')) basePath = "/" + basePath;

 if (!string.IsNullOrEmpty(basePath))
 {
 app.UsePathBase(basePath);
 }

 return app.UseMiddleware<BasePathRedirectMiddleware>();
 }
 }
}
