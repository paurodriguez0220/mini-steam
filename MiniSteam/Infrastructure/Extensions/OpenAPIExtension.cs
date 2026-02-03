using Microsoft.OpenApi.Models;
using System.Reflection;

namespace MiniSteam.Infrastructure.Extensions
{
    public static class OpenAPIExtension
    {
        public static IServiceCollection AddOpenAPIDocumentation(this IServiceCollection services)
        {
            services.AddSwaggerGen(options =>
            {
                options.SwaggerDoc("v1", new OpenApiInfo
                {
                    Title = "MiniSteam API",
                    Version = "v1",
                    Description = "API for managing games in MiniSteam platform",
                    Contact = new OpenApiContact
                    {
                        Name = "MiniSteam Support",
                        Email = "support@ministeam.com"
                    },
                    License = new OpenApiLicense
                    {
                        Name = "MIT License",
                    }
                });

                // Add JWT Authentication to Swagger
                options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    Name = "Authorization",
                    Type = SecuritySchemeType.Http,
                    Scheme = "Bearer",
                    BearerFormat = "JWT",
                    In = ParameterLocation.Header,
                    Description = "Enter 'Bearer' [space] and then your valid token in the text input below.\r\n\r\nExample: \"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...\""
                });

                options.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "Bearer"
                            }
                        },
                        Array.Empty<string>()
                    }
                });

                // Include XML comments from the main project
                var xmlFilename = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
                var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFilename);
                if (File.Exists(xmlPath))
                {
                    options.IncludeXmlComments(xmlPath);
                }

                // Include XML comments from Domain project
                var domainXmlPath = Path.Combine(AppContext.BaseDirectory, "MiniSteam.Domain.xml");
                if (File.Exists(domainXmlPath))
                {
                    options.IncludeXmlComments(domainXmlPath);
                }
            });

            return services;
        }

        public static IApplicationBuilder UseOpenAPIDocumentation(this IApplicationBuilder app)
        {
            app.UseSwagger();

            return app;
        }
    }
}
