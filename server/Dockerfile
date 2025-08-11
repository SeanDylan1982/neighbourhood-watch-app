# ===== Stage 1: Build React Client =====
FROM node:18 AS client-build
WORKDIR /app

# Copy client package files first for cache efficiency
COPY client/package*.json ./client/

# Install client dependencies
RUN cd client && npm install

# Copy the rest of the client source
COPY client ./client

# Build the client
RUN cd client && npm run build
