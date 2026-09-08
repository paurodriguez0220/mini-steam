# ---- build ----
# The build context is the REPOSITORY ROOT, not this folder: the app imports
# shared/theme.css (and shared/game-score.ts) from the repo root, which would be
# outside a folder-scoped context. Compose sets `context: .` and points
# `dockerfile` at this file.
FROM node:22-alpine AS build
WORKDIR /app

# Dependencies first, so a source edit does not invalidate the npm ci layer.
COPY MiniSteamUI/ministeamui/package*.json ./MiniSteamUI/ministeamui/
WORKDIR /app/MiniSteamUI/ministeamui
RUN npm ci

WORKDIR /app
COPY shared ./shared
COPY MiniSteamUI/ministeamui ./MiniSteamUI/ministeamui

# Vite inlines VITE_* variables at build time, so they must be present here.
ARG VITE_API_URL
ARG VITE_API_AUTH_USERNAME
ARG VITE_API_AUTH_PASSWORD
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_API_AUTH_USERNAME=$VITE_API_AUTH_USERNAME
ENV VITE_API_AUTH_PASSWORD=$VITE_API_AUTH_PASSWORD

WORKDIR /app/MiniSteamUI/ministeamui
RUN npm run build

# ---- runtime ----
FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/MiniSteamUI/ministeamui/dist /usr/share/nginx/html
COPY MiniSteamUI/ministeamui/nginx-spa.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
