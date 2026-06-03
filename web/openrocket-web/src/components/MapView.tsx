import { useEffect, useRef } from 'react'
import maplibre from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useVisualizerStore } from '../store'

export default function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibre.Map | null>(null)
  const { trajectory, currentFrame, launchSite, landingSite } = useVisualizerStore()

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    // Initialize map with free style (OpenStreetMap)
    map.current = new maplibre.Map({
      container: mapContainer.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: launchSite || [0, 0],
      zoom: 13,
      pitch: 45,
      bearing: 0,
    })

    map.current.on('load', () => {
      // Add terrain source (if available)
      if (!map.current?.getSource('terrain')) {
        try {
          map.current?.addSource('terrain', {
            type: 'raster-dem',
            url: 'https://demotiles.maplibre.org/terrain-tiles/data/terrain.json',
            tileSize: 256,
          })
          map.current?.setTerrain({ source: 'terrain', exaggeration: 1.5 })
        } catch (err) {
          console.log('Terrain data not available:', err)
        }
      }
    })

    return () => {
      // Cleanup on unmount
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [launchSite])

  // Update markers for launch/landing sites and trajectory
  useEffect(() => {
    if (!map.current) return

    // Remove old markers
    document.querySelectorAll('.rocket-marker').forEach(el => el.remove())

    // Add launch site marker
    if (launchSite) {
      const el = document.createElement('div')
      el.className = 'rocket-marker launch'
      el.style.backgroundImage = 'url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22%2300ff00%22%3E%3Ccircle cx=%2212%22 cy=%2212%22 r=%228%22/%3E%3C/svg%3E")'
      el.style.width = '24px'
      el.style.height = '24px'
      el.title = 'Launch Site'
      new maplibre.Marker(el).setLngLat(launchSite).addTo(map.current)
    }

    // Add landing site marker
    if (landingSite) {
      const el = document.createElement('div')
      el.className = 'rocket-marker landing'
      el.style.backgroundImage = 'url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22%23ff0000%22%3E%3Ccircle cx=%2212%22 cy=%2212%22 r=%228%22/%3E%3C/svg%3E")'
      el.style.width = '24px'
      el.style.height = '24px'
      el.title = 'Landing Site'
      new maplibre.Marker(el).setLngLat(landingSite).addTo(map.current)
    }

    // Add trajectory polyline
    if (trajectory.length > 0) {
      const coords = trajectory.map(p => [p.lng, p.lat])
      if (!map.current.getSource('trajectory')) {
        map.current.addSource('trajectory', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: coords,
            },
            properties: {},
          },
        })
        map.current.addLayer({
          id: 'trajectory-line',
          type: 'line',
          source: 'trajectory',
          paint: {
            'line-color': '#00ff00',
            'line-width': 3,
            'line-opacity': 0.8,
          },
        })
      }

      // Update current position marker
      const currentPos = trajectory[currentFrame]
      if (currentPos) {
        if (!map.current.getSource('rocket-pos')) {
          map.current.addSource('rocket-pos', {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [currentPos.lng, currentPos.lat],
              },
              properties: { alt: currentPos.altitude },
            },
          })
          map.current.addLayer({
            id: 'rocket-pos-circle',
            type: 'circle',
            source: 'rocket-pos',
            paint: {
              'circle-radius': 8,
              'circle-color': '#ff6b00',
              'circle-opacity': 0.9,
            },
          })
        } else {
          map.current.getSource('rocket-pos').setData({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [currentPos.lng, currentPos.lat],
            },
            properties: { alt: currentPos.altitude },
          })
        }
      }
    }
  }, [trajectory, currentFrame, launchSite, landingSite])

  return (
    <div
      ref={mapContainer}
      style={{
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: '350px',
        height: '350px',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
        zIndex: 5,
      }}
    />
  )
}
