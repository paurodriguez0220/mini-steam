using MiniSteam.Infrastructure.Extensions;
using MiniSteam.Middleware;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();

builder.Services.AddJwtAuthentication(builder.Configuration);
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddConfiguredCors(builder.Configuration);


var app = builder.Build();

app.UseGlobalExceptionHandler();
app.UseBasePathRedirect();

app.UseCors("DefaultCorsPolicy");

// Configure the HTTP request pipeline.
app.MapOpenApi();
app.MapScalarApiReference();
app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

// Apply rate limiting middleware
app.UseRateLimiting(TimeSpan.FromSeconds(builder.Configuration.GetValue<int>("RateLimiting:WindowSeconds")));

app.Run();
