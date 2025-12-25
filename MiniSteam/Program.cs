using Microsoft.EntityFrameworkCore;
using MiniSteam.Application.Interfaces;
using MiniSteam.Application.Services;
using MiniSteam.Infrastructure.Data;
using MiniSteam.Infrastructure.Repositories;
using MiniSteam.Middleware;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);


var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

// Add DbContext
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString));

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

// DI
builder.Services.AddScoped<IGameRepository, GameRepository>();
builder.Services.AddScoped<GameService>();

var app = builder.Build();

// Apply base path and root redirect middleware
app.UseBasePathRedirect();

// Configure the HTTP request pipeline.
app.MapOpenApi();
app.MapScalarApiReference();
app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();
app.Run();
