FROM node:18 AS builder

WORKDIR /app

COPY web/openrocket-web/package.json ./
RUN npm install

COPY web/openrocket-web/ ./
RUN npm run build

FROM nginx:stable

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
