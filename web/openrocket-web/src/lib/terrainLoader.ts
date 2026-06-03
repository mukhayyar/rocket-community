/**
 * Load terrain mesh from MapLibre elevation data.
 * Uses OpenElevation API or GEBCO data for elevation.
 */

export interface TerrainTile {
  url: string
  bounds: [[number, number], [number, number]] // [[w, s], [e, n]]
  resolution: number
}

// Free elevation tile sources
export const TERRAIN_SOURCES = {
  maptiler: 'https://api.maptiler.com/tiles/terrain-quantized-mesh/{z}/{x}/{y}.quantized-mesh',
  gebco: 'https://tiles.gebco.net/data/gebco_2023/geotiff/',
  // For demo: use a simple elevation API
  openElevation: 'https://api.opentopodata.org/v1/gebco30',
}

export async function getElevation(lat: number, lng: number): Promise<number> {
  try {
    const response = await fetch(
      `https://api.opentopodata.org/v1/gebco30?locations=${lat},${lng}`
    )
    const data = await response.json()
    return data.results?.[0]?.elevation || 0
  } catch {
    return 0
  }
}

export async function getElevationBatch(
  points: Array<[number, number]>
): Promise<number[]> {
  // Limit API calls - get elevation for sample points
  const sampled = points.length > 10 ? points.filter((_, i) => i % Math.ceil(points.length / 10) === 0) : points
  
  try {
    const locationsStr = sampled.map(([lat, lng]) => `${lat},${lng}`).join('|')
    const response = await fetch(
      `https://api.opentopodata.org/v1/gebco30?locations=${locationsStr}`
    )
    const data = await response.json()
    return data.results?.map((r: any) => r.elevation || 0) || []
  } catch {
    return sampled.map(() => 0)
  }
}
