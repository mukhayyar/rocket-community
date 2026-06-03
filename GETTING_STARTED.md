# Getting Started - Rocket Community Platform

## 5-Minute Quick Start

### 1. Install Dependencies
```bash
cd /tmp/rocket-community
npm run install-all
```

### 2. Start the Backend
```bash
cd server
npm start
# Should output: "🚀 Rocket Community API running on http://localhost:3000"
```

### 3. Start the Frontend (in another terminal)
```bash
cd web/openrocket-web
npm run dev
# Should output: "Local: http://localhost:5173"
```

### 4. Open in Browser
Visit `http://localhost:5173` and you should see the RocketHub home page.

## Testing the Platform

### Upload a Test Rocket
1. Click "Upload" in the navigation
2. Fill in rocket details:
   - Name: "Test Rocket"
   - Designer: "Your Name"
3. Create a test CSV file (`test.csv`):
```csv
time,altitude,xPos,yPos,rollRate,pitchRate,yawRate
0,0,0,0,0,0,0
1,100,10,5,0,0,0
2,150,20,10,0,0,0
3,180,30,15,0,0,0
4,200,40,20,0,0,0
5,180,45,25,0,0,0
6,150,48,28,0,0,0
7,100,50,30,0,0,0
8,50,51,31,0,0,0
9,0,52,32,0,0,0
```
4. Select the test.csv file
5. Click "Upload Rocket"

### View in Gallery
- Go to home page
- Should see your "Test Rocket" card
- Click to view details with 3D visualization

### Test Comments
- On rocket detail page, scroll to comments section
- Enter a comment and rating
- Submit without entering a name (anonymous)

### Check Leaderboard
- Go to "Leaderboard" in navigation
- Switch between Altitude/Distance/Duration
- Should see your test rocket ranked

## Project Structure Summary

```
rocket-community/
├── server/                      # Express.js backend
│   ├── db.js                   # SQLite database setup
│   ├── index.js                # API routes
│   └── package.json            # Dependencies
├── web/
│   └── openrocket-web/         # React/Vite frontend
│       ├── src/
│       │   ├── components/     # UI components
│       │   │   ├── Gallery.tsx        # Rocket listing
│       │   │   ├── Upload.tsx         # Upload form
│       │   │   ├── RocketDetail.tsx   # Detail + viewer
│       │   │   ├── Leaderboard.tsx    # Rankings
│       │   │   ├── Scene.tsx          # 3D viewer
│       │   │   └── ...
│       │   ├── App.tsx          # Router setup
│       │   ├── store.ts         # Zustand state
│       │   └── lib/
│       │       ├── api.ts       # API endpoint config
│       │       ├── csvParser.ts # CSV parsing
│       │       └── orkParser.ts # ORK XML parsing
│       ├── tailwind.config.js
│       ├── postcss.config.js
│       └── vite.config.ts
├── README.md                    # Project overview
├── DEPLOYMENT.md                # Deploy to Coolify
└── GETTING_STARTED.md          # This file
```

## Key Features Working

✅ **Gallery** - Browse all rockets, sorted by recent/trending/altitude/distance
✅ **Upload** - Add rockets with CSV flight data
✅ **3D Viewer** - Three.js visualization with terrain mapping
✅ **Comments** - Anonymous discussion (rating 1-5 stars)
✅ **Leaderboards** - Track top performers by metric
✅ **Search** - (Backend ready, frontend not yet integrated)
✅ **Community Stats** - (Backend ready, frontend not yet integrated)

## Troubleshooting

### "Cannot find module" errors
```bash
# Make sure you installed dependencies
npm run install-all
```

### Port already in use
```bash
# Change port in vite.config.ts (frontend)
# Change PORT env var for backend (default 3000)
```

### API connection errors
- Check backend is running on localhost:3000
- Check frontend can reach http://localhost:3000/api/stats
- In production, update `VITE_API_URL` or use `/api` proxy

### Database errors
- Delete `server/rockets.db` to reset
- Tables will auto-create on startup

### CSV parsing issues
- Ensure CSV format: `time,altitude,xPos,yPos,rollRate,pitchRate,yawRate`
- No header row needed (or it will fail to parse)
- All values must be numbers

## Next Steps

1. **Deploy to Coolify**
   - See DEPLOYMENT.md
   - Point domain to your instance
   - Configure API URL in frontend

2. **Add More Features**
   - User authentication (optional)
   - Rocket design editor (OpenRocket integration)
   - Advanced comparison tool
   - Export to OpenRocket format
   - Dark/Light theme toggle

3. **Improve Content**
   - Add sample rockets for demo
   - Create "featured" selection
   - Add community challenges
   - Newsletter integration

## API Endpoints Quick Reference

```
GET  /api/rockets?sort=recent|trending|altitude|distance
POST /api/rockets (multipart: name, designer, csv, ork?)
GET  /api/rockets/:id
POST /api/rockets/:id/comments (json: author?, text, rating?)

GET  /api/leaderboards/altitude|distance|duration
GET  /api/search?q=query
GET  /api/stats
```

## Questions?

Check the components source code - each is well-documented with clear intent!
