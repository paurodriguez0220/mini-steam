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

# The SQLite file lives on a volume at /data. Create it while still root and hand
# it to the app user - a volume inherits the ownership of its mount point in the
# image, and the app cannot create the database in a root-owned directory.
RUN mkdir -p /data && chown -R $APP_UID:$APP_UID /data
VOLUME /data

# Run as the non-root user the base image provides.
USER $APP_UID

ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "MiniSteam.dll"]
