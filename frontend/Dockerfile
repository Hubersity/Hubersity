# Use Node.js base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Run in dev mode (like your docker-compose command)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

