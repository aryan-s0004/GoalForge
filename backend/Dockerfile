FROM node:18-alpine

WORKDIR /app

# Copy package files and prisma schema first for proper client compilation
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Explicitly compile and build the Prisma client for the alpine target
RUN npx prisma generate

# Copy the rest of the backend source code
COPY . .

EXPOSE 5000

# Start the backend server
CMD ["npm", "start"]
