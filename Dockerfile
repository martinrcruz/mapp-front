# Build stage
FROM node:20-alpine as builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder
COPY --from=builder /app/dist/mapp-front/browser /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 