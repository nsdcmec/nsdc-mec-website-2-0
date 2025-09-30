# Dockerfile

# --- Build Stage ---
# This stage uses Node to build your static files.
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of your app's source code
COPY . .

# Build the Astro site. The output will be in the /app/dist/ directory.
RUN npm run build


# --- Production Stage ---
# This stage uses a tiny Nginx server to serve the static files.
FROM nginx:stable-alpine

# Copy the built static files from the 'builder' stage to the Nginx public directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80 (the default Nginx port)
EXPOSE 80

# The default Nginx command starts the server. We just need to tell it to stay in the foreground.
CMD ["nginx", "-g", "daemon off;"]
