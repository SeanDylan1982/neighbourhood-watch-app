# ===== Stage 1: Build React Client =====
FROM node:18 AS client-build
WORKDIR /app

# Copy client package files
COPY client/package*.json ./client/
RUN cd client && npm install

# Copy client source and build
COPY client ./client
RUN cd client && npm run build

# ===== Stage 2: Server =====
FROM node:18
WORKDIR /app

# Copy and install server dependencies
COPY server/package*.json ./server/
RUN cd server && npm install

# Copy server source
COPY server ./server

# Copy built client into server's public folder
COPY --from=client-build /app/client/build ./server/public

# Set working directory to server
WORKDIR /app/server

# Expose Railway's dynamic port (Railway will set PORT env var)
EXPOSE $PORT

# Start server using railway-start.js for better error handling
CMD ["node", "railway-start.js"]
