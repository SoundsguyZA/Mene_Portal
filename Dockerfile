# Dockerfile for Mene Portal Node.js Server
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    chromium \
    chromium-chromedriver \
    git

# Set Chrome executable path for Playwright
ENV CHROME_BIN=/usr/bin/chromium-browser
ENV CHROME_PATH=/usr/bin/chromium-browser

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Install PM2 globally
RUN npm install -g pm2

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p data/screenshots data/logs data/memory

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/agents || exit 1

# Start with PM2
CMD ["pm2-runtime", "start", "ecosystem.config.js"]