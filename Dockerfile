# Build stage - Frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Production stage - Backend + serving built frontend
FROM node:20-alpine
WORKDIR /app

# Copy server
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev

COPY server/ ./server/

# Copy built frontend
COPY --from=frontend-build /app/client/dist ./client/dist

# Create uploads directory
RUN mkdir -p server/uploads

# Environment
ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["node", "server/src/index.js"]
