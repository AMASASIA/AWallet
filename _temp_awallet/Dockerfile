FROM node:22-slim

WORKDIR /app

# Copy package info and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Build the Vite frontend application
RUN npm run build

# Expose Cloud Run's default port
EXPOSE 8080

# Set environment variables for production
ENV NODE_ENV=production
ENV PORT=8080

# Start the server using the start script
CMD ["npm", "start"]
