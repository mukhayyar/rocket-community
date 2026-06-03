# OpenRocket Web Visualizer

Modern web-based 3D visualization for OpenRocket flight simulations with terrain mapping and advanced analytics.

## Features

### 🚀 3D Flight Visualization
- Real-time rocket trajectory in 3D space
- Rocket model rendering from .ork design files with proper geometry
- Trail visualization with altitude tracking
- Multi-component rocket rendering (nose cones, body tubes, fins, motors)
- Motor burn effects (flame visualization during powered ascent)

### 🗺️ Geospatial Integration
- MapLibre GL terrain rendering
- GPS coordinate tracking (lat/lng)
- Launch/landing site markers
- Interactive map overlay
- Real-time position tracking on geographic map

### 📊 Flight Analytics Dashboard
- Max altitude / apogee metrics
- Total distance and flight time statistics
- Progress bar with frame counter
- Rocket design info (name, designer, component count)
- Real-time telemetry updates

### ⏯️ Playback Controls
- Play/pause with variable speed (0.1x - 3x)
- Timeline scrubber for frame-by-frame control
- Real-time telemetry display (altitude, coordinates, distance)
- Trail and map visibility toggles

### 📦 Data Support
- **CSV Format**: OpenRocket flight data (time, altitude, position, orientation)
- **ORK Format**: OpenRocket design files with full geometry parsing
- **Geospatial**: Automatic lat/lng conversion from local coordinates

## Stack

- **Frontend**: React 18 + TypeScript
- **3D Engine**: Three.js (via @react-three/fiber)
- **Mapping**: MapLibre GL JS
- **Parsing**: xml2js for ORK files
- **State**: Zustand
- **Build**: Vite

## Getting Started

```bash
pnpm install
pnpm dev
```

Open http://localhost:5173

## Usage

1. **Set Launch Coordinates**
   - Enter latitude/longitude for your launch site
   - Used to convert local east/north to GPS coordinates

2. **Upload Files**
   - **CSV**: Flight simulation data from OpenRocket (required)
   - **ORK**: Rocket design file (optional, shows geometry)

3. **Play Animation**
   - Click ▶ Play to start playback
   - Adjust speed slider for slow-motion or fast-forward
   - Scrub timeline to jump to specific frame

4. **Explore Data**
   - View 3D rocket and trajectory
   - Check analytics dashboard for flight stats
   - Toggle map overlay for geospatial view
   - Monitor telemetry (altitude, coordinates, distance)

## File Formats

### CSV (Flight Simulation Data)
```
# Time (s),Altitude (ft),Position East of launch (ft),Position North of launch (ft),Roll rate (r/s),Pitch rate (r/s),Yaw rate (r/s)
0,0,0,0,0,0,0
1,25.3,5.2,8.1,0.015,0.022,0.008
...
```

### ORK (Rocket Design)
OpenRocket's XML format containing:
- Rocket metadata (name, designer, revision)
- Component definitions (nose cone, body tubes, fins, motors)
- Material properties and dimensions
- Motor configurations and staging

## Architecture

```
src/
├── components/
│   ├── Scene.tsx          # Three.js 3D viewport with lighting
│   ├── MapView.tsx        # MapLibre GL map overlay
│   ├── Rocket.tsx         # Dynamic rocket model from geometry
│   ├── Trajectory.tsx     # Trail visualization
│   ├── MotorBurn.tsx      # Motor burn effects
│   ├── Dashboard.tsx      # Flight analytics
│   ├── FileUpload.tsx     # Input controls
│   └── Controls.tsx       # Playback UI
├── lib/
│   ├── csvParser.ts       # Flight data + geospatial conversion
│   ├── orkParser.ts       # Rocket design XML parsing
│   └── terrainLoader.ts   # Elevation data loader
├── store.ts               # Zustand state management
└── App.tsx
```

## Features Implemented

- ✅ 3D trajectory visualization
- ✅ CSV flight data parsing with coordinate conversion
- ✅ ORK rocket design parsing
- ✅ Dynamic rocket geometry rendering
- ✅ Motor burn effects (flame during ascent)
- ✅ Flight analytics dashboard
- ✅ MapLibre GL map integration
- ✅ Playback controls with telemetry
- ✅ Geospatial coordinate tracking

## Features Coming Soon

- [ ] Terrain mesh integration into 3D scene
- [ ] Proper rotation integration from angular rates
- [ ] Multi-stage rocket staging visualization
- [ ] Parachute deployment effects
- [ ] Export trajectory as GeoJSON
- [ ] Custom elevation data import
- [ ] Advanced filtering and search
- [ ] Flight performance comparison

## Demo Data

Included sample files:
- `public/rocket.ork` - EEPISAT Teknofest rocket design
- `public/new.csv` - Sample trajectory (674 points)
- `public/orSIm.csv` - Alternative trajectory (476 points)

## Testing

See [TESTING.md](./TESTING.md) for detailed testing guide and checklist.

## Attribution

- [MapLibre GL JS](https://maplibre.org/) - Open mapping library
- [Three.js](https://threejs.org/) - 3D graphics engine
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/) - React 3D renderer
- [Zustand](https://github.com/pmndrs/zustand) - State management
- [OpenRocket](https://openrocket.info/) - Rocket simulation software

## License

MIT
