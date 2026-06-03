import { TrajectoryPoint } from '../store'

// Convert east/north local coordinates to lat/lng
function localToGlobal(east: number, north: number, launchLat: number, launchLng: number): [number, number] {
  // Approximate: 1 degree latitude = 111 km, 1 degree longitude = 111 km * cos(lat)
  const latPerMeter = 1 / 111000
  const lngPerMeter = 1 / (111000 * Math.cos((launchLat * Math.PI) / 180))

  return [
    launchLng + east * lngPerMeter,
    launchLat + north * latPerMeter,
  ]
}

export function parseCSV(
  csvText: string,
  launchLat: number = 0,
  launchLng: number = 0
): TrajectoryPoint[] {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) return []

  const points: TrajectoryPoint[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const values = line.split(',').map(v => parseFloat(v.trim()))
    if (values.length < 7) continue

    const [time, altitudeFt, eastFt, northFt, rollRate, pitchRate, yawRate] = values

    // Convert feet to meters
    const ftToM = (ft: number) => ft / 3.281
    const east = ftToM(eastFt)
    const north = ftToM(northFt)
    const [lng, lat] = localToGlobal(east, north, launchLat, launchLng)

    points.push({
      time,
      altitude: ftToM(altitudeFt),
      east,
      north,
      lat,
      lng,
      rollRate,
      pitchRate,
      yawRate,
    })
  }

  return points
}
