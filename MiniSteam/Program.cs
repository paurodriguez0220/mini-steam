using MiniSteam;
using MiniSteam.Middleware;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();

builder.Services.AddInfrastructure(builder.Configuration);

var rateLimitSeconds = builder.Configuration.GetValue<int>("RateLimiting:WindowSeconds");
var app = builder.Build();

// Global exception handling middleware should be first so it can catch exceptions from subsequent middleware.
app.UseGlobalExceptionHandler();

// Apply base path and root redirect middleware
app.UseBasePathRedirect();

// Configure the HTTP request pipeline.
app.MapOpenApi();
app.MapScalarApiReference();
app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.UseRateLimiting(TimeSpan.FromSeconds(rateLimitSeconds));

app.Run();
