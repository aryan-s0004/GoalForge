FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (only production)
RUN npm ci --only=production

# Copy source code
COPY . .

EXPOSE 5000

# Start the backend server
CMD ["npm", "start"]
