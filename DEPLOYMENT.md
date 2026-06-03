# Deployment Guide - Rocket Community Platform

## Deploy to Coolify

### Prerequisites
- Coolify account and access to your server
- A domain (e.g., `rockets.example.com`)
- Git repository setup

### Backend Deployment (Express API)

1. **Create new service in Coolify**:
   - Service type: Docker
   - Repository: Your git repository
   - Dockerfile location: `server.Dockerfile` (see below)

2. **Create `server.Dockerfile`**:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY server/package*.json ./
RUN npm ci --only=production

COPY server/ ./

EXPOSE 3000
CMD ["npm", "start"]
```

3. **Configure environment**:
   - Set `PORT=3000`
   - Database will be created at `/app/rockets.db`

### Frontend Deployment (React App)

1. **Create new service in Coolify**:
   - Service type: Docker
   - Repository: Your git repository
   - Dockerfile location: `web.Dockerfile` (see below)

2. **Create `web.Dockerfile`**:
```dockerfile
FROM node:18-alpine as builder

WORKDIR /app

COPY web/openrocket-web/package*.json ./
RUN npm ci

COPY web/openrocket-web/ ./
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

RUN echo 'server {
  listen 80;
  location / {
    root /usr/share/nginx/html;
    try_files $uri $uri/ /index.html;
  }
  location /api/ {
    proxy_pass http://backend:3000;
  }
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
```

### Configuration

1. **Set up Traefik routing**:
   - Backend: `api.rockets.example.com` → Backend service (port 3000)
   - Frontend: `rockets.example.com` → Frontend service (port 80)

2. **Update frontend API endpoint**:
   - Change `http://localhost:3000` to API domain in components
   - Or use relative paths `/api/`

3. **Enable CORS** (already configured in Express):
   ```javascript
   app.use(cors()) // Allows all origins
   ```

### Database Persistence

- The SQLite database (`rockets.db`) is created in `/app/` directory
- Mount volume: `/app` → persistent volume on host

### Monitoring

- Check logs for errors: `docker logs <container_id>`
- Database health: Look for successful table creation messages
- API status: `curl http://api.rockets.example.com/api/stats`

### Post-Deployment

1. Test upload endpoint:
```bash
curl -X POST http://api.rockets.example.com/api/rockets \
  -F "name=Test Rocket" \
  -F "designer=Test" \
  -F "csv=@sample.csv"
```

2. Visit frontend: `https://rockets.example.com`

3. Create test content:
   - Upload a rocket
   - Add comments
   - Verify leaderboard
   - Check search functionality

## Local Development with Docker Compose

Create `docker-compose.dev.yml`:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: server.Dockerfile
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
    volumes:
      - ./server:/app

  frontend:
    build:
      context: .
      dockerfile: web.Dockerfile
    ports:
      - "5173:5173"
    environment:
      - VITE_API_URL=http://localhost:3000
```

Run with: `docker-compose -f docker-compose.dev.yml up`

## Troubleshooting

### Database issues
- Delete `rockets.db` to reset (all data lost)
- Check SQLite syntax in `db.js`

### File upload not working
- Verify multipart form data handling in server
- Check file size limits (50MB default)

### CORS errors
- Ensure backend has `cors()` middleware
- Check frontend API URL matches backend domain

### Slow uploads
- Increase `limit` in `express.json()` middleware
- Compress CSV files before upload

## Scaling

For production:
- Move from SQLite to PostgreSQL
- Add Redis caching for leaderboards
- Use CDN for static assets
- Implement rate limiting on upload endpoint
- Add API authentication tokens
