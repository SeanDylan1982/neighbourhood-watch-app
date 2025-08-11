# ===== Backend =====
FROM node:18 AS server-build
WORKDIR /app

# Install server deps
COPY server/package*.json ./server/
RUN cd server && npm install

# Copy server code
COPY server ./server

# ===== Frontend =====
FROM node:18 AS client-build
WORKDIR /app

# Install client deps
COPY client/package*.json ./client/
RUN cd client && npm install

# Copy client code
COPY client ./client

# Build client
RUN cd client && npm run build

# ===== Final =====
FROM node:18 AS final
WORKDIR /app

# Copy server from build stage
COPY --from=server-build /app/server ./server

# Copy built client into server's public dir
COPY --from=client-build /app/client/build ./server/public

WORKDIR /app/server

CMD ["node", "railway-start.js"]
