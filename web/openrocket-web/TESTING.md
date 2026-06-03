# Testing Guide

## Quick Start

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Start Dev Server
```bash
pnpm dev
```

### 3. Test with Sample Data

**Included samples:**
- `public/rocket.ork` - EEPISAT Teknofest rocket design
- `public/new.csv` - Flight trajectory data (674 points)
- `public/orSIm.csv` - Alternative trajectory (476 points)

### 4. Upload Files in Browser

1. **Set Launch Coordinates** (default: 0°, 0°)
   - For EEPISAT: Use actual launch location if known
   - Or keep default for testing

2. **Upload CSV**
   - Paste content of `new.csv` or `orSIm.csv`
   - Or use file input

3. **Upload ORK**
   - Load `rocket.ork` to see rocket design parsing

4. **Play Animation**
   - Click ▶ Play
   - Watch trajectory on 3D view + map
   - Scrub timeline with slider

## Testing Checklist

- [ ] CSV uploads without errors
- [ ] Trajectory renders as green trail
- [ ] Timeline scrubber works
- [ ] Playback speed adjusts correctly
- [ ] Map appears in bottom-right corner
- [ ] Launch site marker visible (green circle)
- [ ] Current position marker updates (orange circle)
- [ ] Coordinates show real lat/lng
- [ ] Toggle trail on/off
- [ ] Toggle map on/off

## Expected Data

**CSV Columns** (in order):
```
Time (s) | Altitude (ft) | East (ft) | North (ft) | Roll (r/s) | Pitch (r/s) | Yaw (r/s)
```

**Sample from new.csv:**
```
0,0,0,0,0,0,0
1,25.3,5.2,8.1,0.015,0.022,0.008
...
674,0,1542.3,1203.5,0,0,0
```

## Debugging

### Console Errors
- Open DevTools (F12)
- Check Console tab for errors
- MapLibre errors are expected if internet unavailable

### Map Not Loading
- Requires internet for tile data
- Check network tab in DevTools
- Fallback to basic grid if offline

### Rocket Not Showing
- Ensure CSV is loaded (check store in DevTools)
- ORK parsing may fail silently - check console
- Simplified rocket geometry always renders as fallback

## Next Features to Test

Once implemented:
- [ ] Terrain mesh rendering
- [ ] Proper ORK geometry parsing
- [ ] Rotation visualization
- [ ] Motor burn effects
- [ ] Multi-stage visualization

## File Locations

- **Public assets**: `public/`
- **Source**: `src/`
- **Components**: `src/components/`
- **Parsers**: `src/lib/`
- **State**: `src/store.ts`

## Notes

- Map uses free OpenStreetMap tiles (no API key required)
- Elevation data from OpenElevation API (limited free tier)
- Rocket geometry simplified until proper ORK parsing added
