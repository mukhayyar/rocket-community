FROM node:18-slim

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY server/package*.json ./
RUN npm install

COPY server/ ./

EXPOSE 3000
CMD ["node", "index.js"]
