# ---- build ----
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Restore first so the layer caches when only source changes.
COPY NuGet.config ./
COPY MiniSteam/MiniSteam.csproj MiniSteam/
RUN dotnet restore MiniSteam/MiniSteam.csproj

COPY MiniSteam/ MiniSteam/
RUN dotnet publish MiniSteam/MiniSteam.csproj -c Release -o /app/publish /p:UseAppHost=false

# ---- runtime ----
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

# Run as the non-root user the base image provides.
USER $APP_UID

ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "MiniSteam.dll"]
