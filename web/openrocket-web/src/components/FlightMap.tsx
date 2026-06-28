import { useEffect, useRef, useState } from 'react'
import maplibre from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useVisualizerStore } from '../store'

export default function FlightMap() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibre.Map | null>(null)
  const [ready, setReady] = useState(false)
  const { trajectory, currentFrame, launchSite, isPlaying, setCurrentFrame, playbackSpeed } = useVisualizerStore()

  // Init map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    const center = launchSite || [34, 38.4]

    map.current = new maplibre.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          satellite: {
            type: 'raster',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256,
            attribution: 'Esri',
            maxzoom: 19,
          },
        },
        layers: [{
          id: 'satellite',
          type: 'raster',
          source: 'satellite',
          minzoom: 0,
          maxzoom: 19,
        }],
        terrain: undefined as any,
      },
      center: center as [number, number],
      zoom: 13,
      pitch: 60,
      bearing: -30,
      antialias: true,
    })

    map.current.addControl(new maplibre.NavigationControl(), 'top-left')

    map.current.on('load', () => setReady(true))

    return () => {
      map.current?.remove()
      map.current = null
      setReady(false)
    }
  }, [launchSite])

  // Draw trajectory + markers when ready
  useEffect(() => {
    if (!map.current || !ready || trajectory.length === 0) return

    // Clean old
    try {
      ['trajectory-line', 'trajectory-line-shadow', 'launch-point', 'landing-point', 'rocket-pos-circle'].forEach(id => {
        if (map.current!.getLayer(id)) map.current!.removeLayer(id)
      });
      ['trajectory', 'launch', 'landing', 'rocket-pos'].forEach(id => {
        if (map.current!.getSource(id)) map.current!.removeSource(id)
      })
    } catch {}

    // Build 3D line coordinates [lng, lat, altitude]
    const coords3D = trajectory.map(p => [p.lng, p.lat, p.altitude || 0])

    // Trajectory line (3D with altitude)
    map.current.addSource('trajectory', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: coords3D },
        properties: {},
      },
    })

    // Shadow line on ground
    map.current.addLayer({
      id: 'trajectory-line-shadow',
      type: 'line',
      source: 'trajectory',
      paint: {
        'line-color': '#000',
        'line-width': 2,
        'line-opacity': 0.2,
      },
    })

    // Main trajectory line
    map.current.addLayer({
      id: 'trajectory-line',
      type: 'line',
      source: 'trajectory',
      paint: {
        'line-color': [
          'interpolate', ['linear'], ['line-progress'],
          0, '#00ff88',
          0.3, '#ffaa00',
          0.5, '#ff4444',
          0.7, '#ffaa00',
          1, '#00ff88',
        ],
        'line-width': 4,
        'line-opacity': 0.9,
      },
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
    })

    // Launch marker
    const first = trajectory[0]
    map.current.addSource('launch', {
      type: 'geojson',
      data: { type: 'Feature', geometry: { type: 'Point', coordinates: [first.lng, first.lat] }, properties: {} },
    })
    map.current.addLayer({
      id: 'launch-point',
      type: 'circle',
      source: 'launch',
      paint: { 'circle-radius': 8, 'circle-color': '#00ff88', 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 },
    })

    // Landing marker
    const last = trajectory[trajectory.length - 1]
    map.current.addSource('landing', {
      type: 'geojson',
      data: { type: 'Feature', geometry: { type: 'Point', coordinates: [last.lng, last.lat] }, properties: {} },
    })
    map.current.addLayer({
      id: 'landing-point',
      type: 'circle',
      source: 'landing',
      paint: { 'circle-radius': 8, 'circle-color': '#ff4444', 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 },
    })

    // Rocket position (animated)
    map.current.addSource('rocket-pos', {
      type: 'geojson',
      data: { type: 'Feature', geometry: { type: 'Point', coordinates: [first.lng, first.lat] }, properties: {} },
    })
    map.current.addLayer({
      id: 'rocket-pos-circle',
      type: 'circle',
      source: 'rocket-pos',
      paint: {
        'circle-radius': 10,
        'circle-color': '#ff6b00',
        'circle-stroke-color': '#fff',
        'circle-stroke-width': 3,
        'circle-opacity': 0.95,
      },
    })

    // Fit bounds
    const lngs = trajectory.map(p => p.lng).filter(v => v !== 0)
    const lats = trajectory.map(p => p.lat).filter(v => v !== 0)
    if (lngs.length > 0 && lats.length > 0) {
      const sw: [number, number] = [Math.min(...lngs), Math.min(...lats)]
      const ne: [number, number] = [Math.max(...lngs), Math.max(...lats)]
      map.current.fitBounds([sw, ne], { padding: 80, pitch: 60, bearing: -30, duration: 1500 })
    }
  }, [trajectory, ready])

  // Update rocket position on frame change
  useEffect(() => {
    if (!map.current || !ready || trajectory.length === 0) return
    const p = trajectory[currentFrame]
    if (!p) return

    try {
      const src = map.current.getSource('rocket-pos') as maplibre.GeoJSONSource
      if (src) {
        src.setData({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
          properties: {},
        })
      }
    } catch {}
  }, [currentFrame, trajectory, ready])

  return (
    <div ref={mapContainer} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }} />
  )
}
