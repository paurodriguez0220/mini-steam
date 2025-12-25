using MiniSteam;
using MiniSteam.Middleware;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Apply Auth
builder.Services.AddJwtAuthentication(builder.Configuration);

builder.Services.AddControllers();
builder.Services.AddOpenApi();

builder.Services.AddInfrastructure(builder.Configuration);

var app = builder.Build();

// Apply general exception handling middleware
app.UseGlobalExceptionHandler();

// Apply base path and root redirect middleware
app.UseBasePathRedirect();

// Configure the HTTP request pipeline.
app.MapOpenApi();
app.MapScalarApiReference();
app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

// Apply rate limiting middleware
app.UseRateLimiting(TimeSpan.FromSeconds(builder.Configuration.GetValue<int>("RateLimiting:WindowSeconds")));

app.Run();
