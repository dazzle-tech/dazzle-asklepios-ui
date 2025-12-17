# Use Node.js 22 (required for Rolldown-Vite)
FROM node:22-alpine AS build

# Set the working directory
WORKDIR /app

# Environment variables
ENV GENERATE_SOURCEMAP=false

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Use Nginx to serve the application
FROM nginx:alpine

# Copy built assets from the previous stage
COPY --from=build /app/assets /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]
