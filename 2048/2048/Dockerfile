# ---- build ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Vite inlines VITE_* variables at build time, so they must be present here.
ARG VITE_API_URL
ARG VITE_API_AUTH_USERNAME
ARG VITE_API_AUTH_PASSWORD
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_API_AUTH_USERNAME=$VITE_API_AUTH_USERNAME
ENV VITE_API_AUTH_PASSWORD=$VITE_API_AUTH_PASSWORD

RUN npm run build

# ---- runtime ----
FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx-spa.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
