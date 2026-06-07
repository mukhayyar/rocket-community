import { useEffect, useRef, useState } from 'react'
import maplibre from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useVisualizerStore } from '../store'

export default function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibre.Map | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const { trajectory, currentFrame, launchSite, landingSite } = useVisualizerStore()

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    map.current = new maplibre.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'satellite': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            attribution: 'Esri, Maxar, Earthstar Geographics',
            maxzoom: 19,
          },
        },
        layers: [
          {
            id: 'satellite-layer',
            type: 'raster',
            source: 'satellite',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: launchSite || [0, 0],
      zoom: 14,
      pitch: 60,
      bearing: -20,
    })

    map.current.on('load', () => {
      setMapLoaded(true)
    })

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
        setMapLoaded(false)
      }
    }
  }, [launchSite])

  // Only update sources/layers AFTER map style loaded
  useEffect(() => {
    if (!map.current || !mapLoaded) return

    // Remove old markers
    document.querySelectorAll('.rocket-marker').forEach(el => el.remove())

    if (launchSite) {
      const el = document.createElement('div')
      el.className = 'rocket-marker launch'
      el.style.background = '#00ff00'
      el.style.width = '12px'
      el.style.height = '12px'
      el.style.borderRadius = '50%'
      el.style.border = '2px solid white'
      el.title = 'Launch Site'
      new maplibre.Marker(el).setLngLat(launchSite).addTo(map.current)
    }

    if (landingSite) {
      const el = document.createElement('div')
      el.className = 'rocket-marker landing'
      el.style.background = '#ff0000'
      el.style.width = '12px'
      el.style.height = '12px'
      el.style.borderRadius = '50%'
      el.style.border = '2px solid white'
      el.title = 'Landing Site'
      new maplibre.Marker(el).setLngLat(landingSite).addTo(map.current)
    }

    if (trajectory.length > 0) {
      const coords = trajectory.map(p => [p.lng, p.lat])

      // Remove old sources/layers before re-adding
      try {
        if (map.current.getLayer('trajectory-line')) map.current.removeLayer('trajectory-line')
        if (map.current.getSource('trajectory')) map.current.removeSource('trajectory')
        if (map.current.getLayer('rocket-pos-circle')) map.current.removeLayer('rocket-pos-circle')
        if (map.current.getSource('rocket-pos')) map.current.removeSource('rocket-pos')
      } catch { /* ignore */ }

      map.current.addSource('trajectory', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: coords },
          properties: {},
        },
      })
      map.current.addLayer({
        id: 'trajectory-line',
        type: 'line',
        source: 'trajectory',
        paint: { 'line-color': '#00ff00', 'line-width': 3, 'line-opacity': 0.8 },
      })
    }
  }, [trajectory, launchSite, landingSite, mapLoaded])

  // Update rocket position marker on frame change
  useEffect(() => {
    if (!map.current || !mapLoaded || trajectory.length === 0) return

    const currentPos = trajectory[currentFrame]
    if (!currentPos) return

    const data = {
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [currentPos.lng, currentPos.lat] },
      properties: { alt: currentPos.altitude },
    }

    try {
      const src = map.current.getSource('rocket-pos') as maplibre.GeoJSONSource
      if (src) {
        src.setData(data)
      } else {
        map.current.addSource('rocket-pos', { type: 'geojson', data })
        map.current.addLayer({
          id: 'rocket-pos-circle',
          type: 'circle',
          source: 'rocket-pos',
          paint: { 'circle-radius': 8, 'circle-color': '#ff6b00', 'circle-opacity': 0.9 },
        })
      }
    } catch { /* map not ready */ }
  }, [currentFrame, trajectory, mapLoaded])

  return (
    <div
      ref={mapContainer}
      style={{
        position: 'absolute',
        bottom: 10,
        right: 10,
        width: '300px',
        height: '250px',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
        zIndex: 5,
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    />
  )
}
