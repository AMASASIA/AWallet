# Multi-stage build for AWallet
# 1. Build Frontend
FROM node:18-slim AS builder-frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# 2. Prepare API
FROM node:18-slim
WORKDIR /app
COPY api/package*.json ./
RUN npm install --production

# 3. Final Assembly
# Copy API source
COPY api/ ./

# Ensure the public directory is clean and exists before copying
RUN rm -rf /app/public && mkdir -p /app/public

# Copy built frontend from stage 1 to the 'public' directory of the API
# Note: Ensure React build output matches 'build'
COPY --from=builder-frontend /app/frontend/build/ /app/public/

# Explicit Verification Step: Ensure 'public/index.html' actually exists in the final image
RUN if [ ! -f /app/public/index.html ]; then \
    echo "CRITICAL: /app/public/index.html missing after COPY from stage 1"; \
    ls -la /app/public; \
    exit 1; \
    fi

# Ensure log directory exists
RUN mkdir -p log && chmod 777 log

# Cloud Run injects PORT, so we shouldn't hardcode it to 3001
# But we can keep EXPOSE for documentation (8080/3001)
EXPOSE 8080
ENV PORT=8080

CMD ["node", "server.js"]
