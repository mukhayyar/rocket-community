# Rocket Community Platform

A community-driven rocket visualization and leaderboard platform built on OpenRocket data.

## Features

- **Public Gallery** - Browse shared rocket flights without login
- **Upload Flights** - Share your rocket simulations with CSV data
- **3D Visualization** - View rocket trajectories in Three.js
- **Comments & Ratings** - Discuss flights anonymously
- **Leaderboards** - Track records by altitude, distance, and duration
- **Search** - Find rockets by name or designer
- **Community Stats** - See aggregate community metrics

## Project Structure

```
rocket-community/
├── server/                   # Express API backend
│   ├── db.js               # SQLite schema & initialization
│   ├── index.js            # API endpoints
│   └── package.json        # Backend dependencies
└── web/openrocket-web/     # React frontend (Vite + Tailwind)
    ├── src/
    │   ├── components/     # React components
    │   ├── App.tsx         # Router setup
    │   ├── store.ts        # Zustand state management
    │   └── lib/            # Utilities (CSV, ORK parsing)
    ├── tailwind.config.js
    └── package.json        # Frontend dependencies
```

## Installation & Running

### Backend
```bash
cd server
npm install
npm start
# Runs on http://localhost:3000
```

### Frontend
```bash
cd web/openrocket-web
npm install
npm run dev
# Runs on http://localhost:5173
```

## API Endpoints

- `GET /api/rockets` - List all rockets (with sort: recent|trending|altitude|distance)
- `POST /api/rockets` - Upload new rocket (multipart: name, designer, csv, ork optional)
- `GET /api/rockets/:id` - Get rocket details + comments
- `POST /api/rockets/:id/comments` - Post comment (anonymous or named)
- `GET /api/leaderboards/:category` - Top rockets by category (altitude|distance|duration)
- `GET /api/search?q=query` - Search by name or designer
- `GET /api/stats` - Community statistics

## CSV Format

Required columns (comma-separated):
```
time, altitude, xPos, yPos, rollRate, pitchRate, yawRate
```

Example:
```
0.0,0,0,0,0,0,0
0.1,5,0.1,0,0.5,0,0
0.2,15,0.2,0,1.0,0,0
```

## Technologies

- **Backend**: Express.js, SQLite (better-sqlite3), Multer
- **Frontend**: React 18, Vite, Tailwind CSS, Three.js, React Router
- **Data**: CSV parsing, ORK XML parsing, OpenRocket integration

## Future Features

- User authentication & profiles
- Private gallery collections
- Custom rocket design editor
- WebGL comparison tool
- Export to OpenRocket format
