FROM node:18-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY server/package*.json ./
RUN npm ci

COPY server/ ./

EXPOSE 3000
CMD ["node", "index.js"]
