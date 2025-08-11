# Stage 1: Build React app
FROM node:18 AS build
WORKDIR /app
COPY client/package*.json ./client/
RUN cd client && npm install
COPY client ./client
RUN cd client && npm run build

# Stage 2: Server
FROM node:18
WORKDIR /app
COPY server/package*.json ./
RUN npm install
COPY server ./
COPY --from=build /app/client/build ./public
CMD ["npm", "start"]

