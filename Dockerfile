# Use Node.js 18 LTS
FROM node:18-alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Copy package files and install root dependencies
COPY package*.json ./
RUN npm install

# Copy and install server dependencies
COPY server/package*.json ./server/
RUN cd server && npm install

# Copy and install client dependencies
COPY client/package*.json ./client/
RUN cd client && npm install

# Copy source code
COPY . .

# Build client
RUN cd client && npm run build

# Copy built client to server public directory
RUN mkdir -p server/public && cp -r client/build/* server/public/

# Set working directory to server
WORKDIR /app/server

# Expose Railway's dynamic port
EXPOSE $PORT

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:${PORT:-5000}/api/health || exit 1

# Start server using railway-start.js
CMD ["node", "railway-start.js"]