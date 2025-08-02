FROM node:22

WORKDIR /app

COPY package*.json ./

# Install all dependencies including dev dependencies
RUN npm install

COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

COPY wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

# Default to production mode, but can be overridden
CMD ["/wait-for-it.sh", "postgres:5432", "--", "npm", "run", "start:prod"]