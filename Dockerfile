# Use Node.js official image
FROM node:18 AS build

# Set the working directory
WORKDIR /app

# FIXED: Set max memory to 4GB (4096). 
# GitHub Actions runners have 7GB total. Setting this to 8192 (8GB) causes an immediate OOM crash.
ENV NODE_OPTIONS="--max-old-space-size=4096"

# OPTIONAL: Disable source maps to save massive amounts of memory during build.
# If your build still fails with 4GB RAM, this is the best fix.
ENV GENERATE_SOURCEMAP=false

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of the application code
COPY . .

# Build the application
RUN NODE_OPTIONS="--max-old-space-size=8192" npm run build

# Use Nginx to serve the application
FROM nginx:alpine

RUN apk add --no-cache gettext

COPY --from=build /app/assets /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY config.template.js /usr/share/nginx/html/config.template.js
COPY docker-entrypoint.sh /docker-entrypoint.sh

RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]