# ============================================================
# Dockerfile — micro-sites (Next.js Static Export)
# Build: docker build --build-arg SITE_SLUG=c01-site-institucional -t micro-sites .
# ============================================================

# Stage 1: Dependencies
FROM node:24-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --no-audit --no-fund

# Stage 2: Builder
FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Recebe o site a compilar (default: c01-site-institucional)
ARG SITE_SLUG=c01-site-institucional
ENV SITE_SLUG=$SITE_SLUG

RUN npm run build

# Stage 3: Runner (nginx servindo arquivos estáticos)
FROM nginx:alpine AS runner

ARG SITE_SLUG=c01-site-institucional

# Copia os arquivos estáticos gerados para o nginx
COPY --from=builder /app/dist/$SITE_SLUG /usr/share/nginx/html

# Copia configuração do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
