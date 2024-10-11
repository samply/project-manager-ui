# Stage 1: Build the Vue application
FROM node:alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of your application code
COPY . .

# Build the Vue application
RUN npm run build:standalone

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy the built Vue application from the previous stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration if needed
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 for the Nginx server
EXPOSE 80

# Nginx will run automatically
CMD ["nginx", "-g", "daemon off;"]
