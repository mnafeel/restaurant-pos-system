# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application files
COPY server.js .
COPY print-service.js .

# Create directory for database
RUN mkdir -p /app/data

# Expose ports
EXPOSE 5002 5003

# Start command (will be overridden by docker-compose for different services)
CMD ["node", "server.js"]

