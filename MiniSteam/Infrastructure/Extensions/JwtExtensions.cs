using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace MiniSteam.Infrastructure.Extensions
{
    public static class JwtExtensions
    {
        public static IServiceCollection AddJwtAuthentication(this IServiceCollection services, IConfiguration configuration)
        {
            #region JWT Authentication Configuration
            var jwtIssuer = configuration["Jwt:Issuer"];
            var jwtAudience = configuration["Jwt:Audience"];
            var jwtSecret = configuration["Jwt:Key"];

            if (string.IsNullOrEmpty(jwtIssuer) || string.IsNullOrEmpty(jwtAudience) || string.IsNullOrEmpty(jwtSecret))
                throw new InvalidOperationException("JWT configuration is incomplete. Please check Jwt:Issuer, Jwt:Audience, and Jwt:Key in your configuration.");

            services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidIssuer = jwtIssuer,

                        ValidateAudience = true,
                        ValidAudience = jwtAudience,

                        ValidateIssuerSigningKey = true,
                        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),

                        ValidateLifetime = true,
                        ClockSkew = TimeSpan.Zero // Remove default 5-minute clock skew
                    };

                    options.Events = new JwtBearerEvents
                    {
                        OnChallenge = async context =>
                        {
                            context.HandleResponse();
                            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                            context.Response.ContentType = "application/json";

                            await context.Response.WriteAsJsonAsync(new { message = "Authentication is required. Please provide a valid JWT token." });
                        },
                        OnForbidden = async context =>
                        {
                            context.Response.StatusCode = StatusCodes.Status403Forbidden;
                            context.Response.ContentType = "application/json";
                            
                            await context.Response.WriteAsJsonAsync(new { message = "Access denied. Insufficient permissions." });
                        },
                        OnAuthenticationFailed = async context =>
                        {
                            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                            context.Response.ContentType = "application/json";
                            
                            await context.Response.WriteAsJsonAsync(new { message = "Invalid token.", details = context.Exception.Message });
                        }
                    };
                });

            services.AddAuthorization(options =>
            {
                options.AddPolicy("GameReader", policy => policy.RequireClaim("role", "User", "Admin"));
                options.AddPolicy("GameWriter", policy => policy.RequireClaim("role", "Admin"));
                options.AddPolicy("AdminOnly", policy => policy.RequireClaim("role", "Admin"));
            });
            #endregion

            return services;
        }
    }
}
