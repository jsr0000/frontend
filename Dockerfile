# Use an official Node runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .

# Build the React app for production
RUN npm run build

# --- Production Stage ---
# Use a lightweight web server to serve the static files
FROM nginx:1.25-alpine

# Copy the built app from the build stage
COPY --from=0 /app/build /usr/share/nginx/html

# Copy nginx config if needed (optional, for routing/proxying)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 