# ==========================================
# Stage 1: Build Environment
# ==========================================
FROM node:24-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# ==========================================
# Stage 2: Production Run Environment
# ==========================================
FROM node:24-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy compiled JavaScript output
COPY --from=builder /usr/src/app/dist ./dist

# Run as a non-privileged node user for security hardening
USER node

EXPOSE 3000

CMD ["node", "dist/server.js"]
