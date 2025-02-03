# Use Node.js image
FROM node:18

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application files
COPY . .

# Expose the port for the Express server
EXPOSE 1238

# Start the application
CMD ["node", "server"]
