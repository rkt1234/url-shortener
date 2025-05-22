# Use an official Node.js image
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 3000

# Start the app
CMD [ "npm", "start" ]
