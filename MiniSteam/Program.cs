using Microsoft.EntityFrameworkCore;
using MiniSteam;
using MiniSteam.Application.Interfaces;
using MiniSteam.Application.Services;
using MiniSteam.Infrastructure.Data;
using MiniSteam.Infrastructure.Repositories;
using MiniSteam.Middleware;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();

builder.Services.AddInfrastructure(builder.Configuration);

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
