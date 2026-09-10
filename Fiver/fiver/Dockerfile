# ---- build ----
# The build context is the REPOSITORY ROOT, not this folder: the app imports
# shared/theme.css (and shared/game-score.ts) from the repo root, which would be
# outside a folder-scoped context. Compose sets `context: .` and points
# `dockerfile` at this file.
FROM node:22-alpine AS build
WORKDIR /app

# Dependencies first, so a source edit does not invalidate the npm ci layer.
COPY Fiver/fiver/package*.json ./Fiver/fiver/
WORKDIR /app/Fiver/fiver
RUN npm ci

WORKDIR /app
COPY shared ./shared
COPY Fiver/fiver ./Fiver/fiver

# Vite inlines VITE_* variables at build time, so they must be present here.
ARG VITE_STOREFRONT_ORIGIN
ENV VITE_STOREFRONT_ORIGIN=$VITE_STOREFRONT_ORIGIN

WORKDIR /app/Fiver/fiver
RUN npm run build

# ---- runtime ----
FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/Fiver/fiver/dist /usr/share/nginx/html
COPY Fiver/fiver/nginx-spa.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
