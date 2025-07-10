FROM node:22

WORKDIR /app

COPY package*.json ./
COPY . .

RUN npm install
RUN npm run build

COPY wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh
CMD ["/wait-for-it.sh", "postgres:5432", "--", "npm", "run", "start:prod"]