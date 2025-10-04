# Auto-generated Dockerfile (dev-friendly: includes devDependencies for testing)
FROM node:18-alpine
WORKDIR /usr/src/app

# Copy package files for faster install when dependencies don't change
COPY package*.json ./
# Install all dependencies (including devDependencies) so tests can run in container
RUN npm ci

# Copy project files
COPY . .

# Create logs dir
RUN mkdir -p /usr/src/app/logs

EXPOSE 3000
CMD ["npm", "start"]
