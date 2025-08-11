# ===== Stage 1: Build React Client =====
FROM node:18 AS client-build
WORKDIR /app

RUN chmod +x node_modules/.bin/react-scripts

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
COPY server/package*.json ./
RUN npm install

# Copy server source
COPY server ./

# Copy built client into server's public folder
COPY --from=client-build /app/client/build ./public

# Expose Railway's dynamic port
EXPOSE 5000

# Start server
CMD ["npm", "start"]
