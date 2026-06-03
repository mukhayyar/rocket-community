# Rocket Community Platform - Quick Reference Card

## 🚀 Start Development (3 Commands)

```bash
# Terminal 1: Backend
cd server && npm install && npm start

# Terminal 2: Frontend
cd web/openrocket-web && npm install && npm run dev

# Terminal 3: Visit browser
http://localhost:5173
```

## 📁 Key Files to Modify

| Path | Purpose | When to Edit |
|------|---------|--------------|
| `server/index.js` | API endpoints | Add features/fix bugs |
| `web/openrocket-web/src/App.tsx` | Routes/navigation | Add pages/change layout |
| `web/openrocket-web/src/components/Gallery.tsx` | Rocket listing | Change card style |
| `web/openrocket-web/src/lib/api.ts` | API endpoints | Change API URL |
| `web/openrocket-web/src/store.ts` | Global state | Add app state |

## 🔌 API Endpoints

```bash
# List rockets (with sort: recent, trending, altitude, distance)
GET /api/rockets?sort=recent

# Upload rocket (multipart form data)
POST /api/rockets
  - name, designer, description, launchLat, launchLng
  - Files: csv (required), ork (optional)

# Get rocket + comments
GET /api/rockets/:id

# Add comment
POST /api/rockets/:id/comments
  - { author?: string, text: string, rating?: 1-5 }

# Leaderboard (altitude, distance, duration)
GET /api/leaderboards/altitude

# Search
GET /api/search?q=keyword

# Stats
GET /api/stats
```

## 📊 CSV Format Required

```csv
time,altitude,xPos,yPos,rollRate,pitchRate,yawRate
0.0,0,0,0,0,0,0
0.1,10,1,0.5,0,0,0
0.2,25,2,1,0,0,0
```

**No header row** - Start with data immediately

## 🎨 Component Structure

```
Gallery.tsx          → /                (List all rockets)
Upload.tsx           → /upload          (Upload form)
RocketDetail.tsx     → /rocket/:id      (Viewer + comments)
Leaderboard.tsx      → /leaderboard     (Rankings)
```

## 🔄 Data Flow

```
User uploads CSV
    ↓
Server extracts metrics (altitude, distance, time)
    ↓
Store in SQLite + update leaderboards
    ↓
Frontend fetches and displays
    ↓
User can comment, view, search
```

## 🛠️ Common Tasks

### Add a new API endpoint
```javascript
// server/index.js
app.get('/api/newfeature', (req, res) => {
  const data = db.prepare('SELECT ...').all()
  res.json(data)
})
```

### Add a new component
```typescript
// web/openrocket-web/src/components/NewComponent.tsx
import { useState } from 'react'
export default function NewComponent() {
  return <div>...</div>
}

// Add to App.tsx routes
<Route path="/newpage" element={<NewComponent />} />
```

### Update API URL (production)
```bash
# Set environment variable before build
export VITE_API_URL=https://api.rockets.example.com
npm run build
```

## 📦 Dependencies Summary

| Package | Use | Version |
|---------|-----|---------|
| express | Web framework | ^4.18 |
| better-sqlite3 | Database | ^9.0 |
| multer | File upload | ^1.4 |
| react | UI framework | ^18.3 |
| vite | Dev server | ^5.0 |
| three | 3D graphics | ^r128 |
| tailwindcss | Styling | ^3.4 |
| zustand | State mgmt | ^4.4 |

## 🐳 Docker Deploy

```bash
# Build images
docker build -f server.Dockerfile -t rocket-server .
docker build -f web.Dockerfile -t rocket-web .

# Run with compose
docker-compose -f docker-compose.dev.yml up
```

## 🔍 Debug Tips

| Issue | Solution |
|-------|----------|
| API not responding | Check port 3000, check server logs |
| CORS error | Verify backend CORS is enabled |
| Blank page | Check browser console (F12), check API URL |
| CSV won't parse | Verify format: `time,alt,x,y,roll,pitch,yaw` |
| 3D viewer not loading | Check WebGL support, verify CSV format |

## 📈 Performance Tips

- Use production builds: `npm run build`
- Enable gzip compression (nginx does this)
- Cache static files (nginx/CloudFlare)
- Use CDN for assets (optional)
- Monitor database size (cleanup old records)

## 🔐 Security Checklist

- [x] CORS enabled (can restrict)
- [x] File size limits (50MB)
- [x] SQL prepared statements (no injection)
- [ ] Rate limiting (optional add)
- [ ] Authentication (optional add)

## 📞 Quick Support

```bash
# Test backend
curl http://localhost:3000/api/stats

# Test frontend build
npm run build && npm run preview

# Check database
sqlite3 server/rockets.db "SELECT COUNT(*) FROM rockets;"

# View logs (Docker)
docker logs container_name

# Reset database
rm server/rockets.db && npm start
```

## 🌍 Environment Variables

**Frontend** (`.env`):
```
VITE_API_URL=http://localhost:3000  # Dev
VITE_API_URL=/api                   # Production (proxy)
```

**Backend** (`.env`):
```
PORT=3000
```

## 📚 Documentation Files

- `README.md` - Overview
- `GETTING_STARTED.md` - Setup guide
- `DEPLOYMENT.md` - Production deploy
- `BUILD_SUMMARY.md` - Feature list
- `LAUNCH_CHECKLIST.md` - Pre-launch tasks
- `QUICK_REFERENCE.md` - This file

## ⚡ One-Liners

```bash
# Install all dependencies
npm run install-all

# Run everything at once (macOS/Linux)
(cd server && npm start) & (cd web/openrocket-web && npm run dev) &

# Build for production
cd web/openrocket-web && npm run build

# Deploy to Coolify (requires git repo)
git push origin main
# Then deploy in Coolify dashboard

# Test specific endpoint
curl -X POST http://localhost:3000/api/rockets \
  -F "name=Test" -F "designer=You" -F "csv=@file.csv"
```

---

**Print this page & keep it handy! 🚀**
