# ===== Stage 1: Build React Client =====
FROM node:18 AS client-build
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
RUN npm ci
RUN npm install react-scripts@5.0.1 -g

# Copy and install client dependencies
COPY client/package*.json ./client/
RUN cd client && npm install

# Copy client source and build
COPY client ./client
RUN cd client && npm run build


# ===== Stage 2: Server =====
FROM node:18
WORKDIR /app

# Copy and install server dependencies
# Server deps
COPY server/package*.json ./server/
RUN cd server && npm install

# Copy server source
COPY server ./server

# Copy built client into server's public folder
COPY --from=client-build /app/client/build ./public

# Expose Railway's dynamic port
EXPOSE 5000

# Start server
CMD ["npm", "start"]
