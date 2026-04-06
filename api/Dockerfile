# Fallback Dockerfile for subfolder deployment
FROM node:18-slim AS builder-frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM node:18-slim
WORKDIR /app
COPY api/package*.json ./
RUN npm install --production
COPY api/ ./
RUN rm -rf public && mkdir -p public
COPY --from=builder-frontend /app/frontend/build/ /app/public/
RUN mkdir -p log && chmod 777 log
EXPOSE 8080
ENV PORT=8080
CMD ["node", "server.js"]
