# Stage 1: Build the Vue application
FROM node:alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of your application code
COPY . .
COPY docker/.env.template                   ./.env
COPY docker/.env.standalone.template        ./.env.standalone

# Build the Vue application
RUN npm run build:standalone

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

WORKDIR /usr/share/nginx/html

# Copy the built Vue application from the previous stage
COPY --from=build /app/dist .

# Copy custom Nginx configuration if needed
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 for the Nginx server
EXPOSE 80

ADD docker/start.sh                 /samply/
RUN chmod +x                        /samply/start.sh

COPY docker/keycloak.json .
COPY docker/config.json .


CMD ["/samply/start.sh"]
