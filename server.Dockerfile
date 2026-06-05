FROM node:18

WORKDIR /app

COPY server/package*.json ./
RUN npm install

COPY server/ ./

RUN mkdir -p /app/data
VOLUME /app/data

EXPOSE 3000
CMD ["node", "index.js"]
