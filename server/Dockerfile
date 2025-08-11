# ===== Stage 1: Build React Client =====
FROM node:18 AS client-build
WORKDIR /app

# Copy only client dependency files
COPY client/package*.json ./client/

# Install client dependencies
RUN cd client && npm install

# Copy client source
COPY client ./client

# Build React app (ESLint safe: only installed once inside client/)
RUN cd client && npm run build


# ===== Stage 2: Server =====
FROM node:18
WORKDIR /app

# Copy only server dependency files
COPY server/package*.json ./server/

# Install server dependencies
RUN cd server && npm install

# Copy server source
COPY server ./server

# Copy built client from stage 1 into server's public folder
COPY --from=client-build /app/client/build ./server/public

# Set working directory to server
WORKDIR /app/server

# Expose port for Railway
EXPOSE 5000

# Start server
CMD ["npm", "start"]
