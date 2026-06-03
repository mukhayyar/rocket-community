FROM node:18-alpine as builder

WORKDIR /app

COPY web/openrocket-web/package*.json ./
RUN npm ci

COPY web/openrocket-web/ ./
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
