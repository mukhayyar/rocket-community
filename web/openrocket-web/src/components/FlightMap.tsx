import { useEffect, useRef, useState } from 'react'
import maplibre from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import * as THREE from 'three'
import { useVisualizerStore } from '../store'

// Convert lng/lat/alt to MapLibre mercator coordinates
function lngLatAltToMercator(lng: number, lat: number, alt: number) {
  const mercator = maplibre.MercatorCoordinate.fromLngLat([lng, lat], alt)
  return { x: mercator.x, y: mercator.y, z: mercator.z }
}

export default function FlightMap() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibre.Map | null>(null)
  const [ready, setReady] = useState(false)
  const rocketRef = useRef<THREE.Group | null>(null)
  const trailRef = useRef<THREE.Line | null>(null)
  const flameRef = useRef<THREE.PointLight | null>(null)
  const { trajectory, currentFrame, launchSite } = useVisualizerStore()

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
      },
      center: center as [number, number],
      zoom: 14,
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

  // Add 3D layer + trajectory when ready
  useEffect(() => {
    if (!map.current || !ready || trajectory.length === 0) return

    const m = map.current
    const origin = trajectory[0]
    const originMerc = maplibre.MercatorCoordinate.fromLngLat([origin.lng, origin.lat], 0)
    const scale = originMerc.meterInMercatorCoordinateUnits()

    // Remove old layers
    try {
      if (m.getLayer('3d-rocket')) m.removeLayer('3d-rocket')
      if (m.getLayer('trajectory-line')) m.removeLayer('trajectory-line')
      if (m.getLayer('trajectory-shadow')) m.removeLayer('trajectory-shadow')
      if (m.getLayer('launch-point')) m.removeLayer('launch-point')
      if (m.getLayer('landing-point')) m.removeLayer('landing-point')
      if (m.getSource('trajectory')) m.removeSource('trajectory')
      if (m.getSource('launch')) m.removeSource('launch')
      if (m.getSource('landing')) m.removeSource('landing')
    } catch {}

    // === TRAJECTORY LINE (2D on map) ===
    const coords = trajectory.map(p => [p.lng, p.lat])
    m.addSource('trajectory', {
      type: 'geojson',
      data: { type: 'Feature', geometry: { type: 'LineString', coordinates: coords }, properties: {} },
    })
    m.addLayer({
      id: 'trajectory-shadow',
      type: 'line',
      source: 'trajectory',
      paint: { 'line-color': '#00ff88', 'line-width': 3, 'line-opacity': 0.4, 'line-dasharray': [2, 2] },
    })

    // Launch + landing markers
    m.addSource('launch', {
      type: 'geojson',
      data: { type: 'Feature', geometry: { type: 'Point', coordinates: [origin.lng, origin.lat] }, properties: {} },
    })
    m.addLayer({
      id: 'launch-point', type: 'circle', source: 'launch',
      paint: { 'circle-radius': 8, 'circle-color': '#00ff88', 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 },
    })

    const last = trajectory[trajectory.length - 1]
    m.addSource('landing', {
      type: 'geojson',
      data: { type: 'Feature', geometry: { type: 'Point', coordinates: [last.lng, last.lat] }, properties: {} },
    })
    m.addLayer({
      id: 'landing-point', type: 'circle', source: 'landing',
      paint: { 'circle-radius': 8, 'circle-color': '#ff4444', 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 },
    })

    // === THREE.JS CUSTOM LAYER (3D Rocket) ===
    const camera = new THREE.Camera()
    const scene = new THREE.Scene()
    let renderer: THREE.WebGLRenderer

    // Build rocket mesh
    const rocketGroup = new THREE.Group()

    // Nose cone
    const noseGeo = new THREE.ConeGeometry(0.4, 1.2, 16)
    const noseMat = new THREE.MeshPhongMaterial({ color: 0xff6b00, emissive: 0xff3300, emissiveIntensity: 0.3 })
    const nose = new THREE.Mesh(noseGeo, noseMat)
    nose.position.y = 2.3
    rocketGroup.add(nose)

    // Body tube
    const bodyGeo = new THREE.CylinderGeometry(0.4, 0.4, 2.5, 16)
    const bodyMat = new THREE.MeshPhongMaterial({ color: 0x444444, shininess: 60 })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.position.y = 0.9
    rocketGroup.add(body)

    // Fins (4x)
    for (let i = 0; i < 4; i++) {
      const finGeo = new THREE.BoxGeometry(0.08, 1.2, 0.5)
      const finMat = new THREE.MeshPhongMaterial({ color: 0x222222 })
      const fin = new THREE.Mesh(finGeo, finMat)
      fin.position.y = -0.2
      const angle = (i / 4) * Math.PI * 2
      fin.position.x = Math.cos(angle) * 0.55
      fin.position.z = Math.sin(angle) * 0.55
      fin.rotation.y = angle
      rocketGroup.add(fin)
    }

    // Nozzle
    const nozzleGeo = new THREE.CylinderGeometry(0.15, 0.3, 0.4, 16)
    const nozzleMat = new THREE.MeshPhongMaterial({ color: 0x666666, shininess: 80 })
    const nozzle = new THREE.Mesh(nozzleGeo, nozzleMat)
    nozzle.position.y = -0.55
    rocketGroup.add(nozzle)

    // Flame (point light + mesh)
    const flameLight = new THREE.PointLight(0xff4400, 2, 500)
    flameLight.position.y = -1
    rocketGroup.add(flameLight)
    flameRef.current = flameLight

    const flameGeo = new THREE.ConeGeometry(0.25, 1.5, 8)
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.7 })
    const flame = new THREE.Mesh(flameGeo, flameMat)
    flame.position.y = -1.2
    flame.rotation.x = Math.PI
    flame.name = 'flame'
    rocketGroup.add(flame)

    scene.add(rocketGroup)
    rocketRef.current = rocketGroup

    // Trail line (3D path already traveled)
    const trailGeo = new THREE.BufferGeometry()
    const trailMat = new THREE.LineBasicMaterial({ color: 0x00ff88, linewidth: 2, transparent: true, opacity: 0.7 })
    const trail = new THREE.Line(trailGeo, trailMat)
    scene.add(trail)
    trailRef.current = trail

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.6))
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
    dirLight.position.set(100, 200, 100)
    scene.add(dirLight)

    const customLayer: maplibre.CustomLayerInterface = {
      id: '3d-rocket',
      type: 'custom',
      renderingMode: '3d',

      onAdd(_map, gl) {
        renderer = new THREE.WebGLRenderer({
          canvas: _map.getCanvas(),
          context: gl,
          antialias: true,
        })
        renderer.autoClear = false
      },

      render(gl, args) {
        // Update rocket position from current frame
        const store = useVisualizerStore.getState()
        const frame = store.currentFrame
        const traj = store.trajectory
        if (traj.length === 0 || !rocketRef.current) return

        const p = traj[Math.min(frame, traj.length - 1)]
        const merc = lngLatAltToMercator(p.lng, p.lat, p.altitude)

        // Position rocket in mercator space relative to origin
        const rx = (merc.x - originMerc.x) / scale
        const ry = (merc.y - originMerc.y) / scale
        const rz = p.altitude

        rocketRef.current.position.set(rx, rz, -ry)

        // Rocket orientation: point in direction of travel
        if (frame > 0 && frame < traj.length - 1) {
          const prev = traj[frame - 1]
          const next = traj[Math.min(frame + 1, traj.length - 1)]
          const dx = (next.lng - prev.lng) / scale
          const dy = next.altitude - prev.altitude
          const dz = -(next.lat - prev.lat) / scale
          if (Math.abs(dx) > 0.0001 || Math.abs(dy) > 0.01 || Math.abs(dz) > 0.0001) {
            const dir = new THREE.Vector3(dx, dy, dz).normalize()
            const up = new THREE.Vector3(0, 1, 0)
            const quat = new THREE.Quaternion().setFromUnitVectors(up, dir)
            rocketRef.current.quaternion.copy(quat)
          }
        }

        // Flame visibility (on during ascent)
        const flameObj = rocketRef.current.getObjectByName('flame')
        const ascending = frame > 0 && p.altitude > traj[frame - 1]?.altitude
        if (flameObj) {
          flameObj.visible = ascending
          if (flameRef.current) flameRef.current.intensity = ascending ? 2 + Math.sin(Date.now() * 0.01) : 0
        }

        // Update trail (path traveled so far)
        if (trailRef.current && frame > 1) {
          const positions: number[] = []
          for (let i = 0; i <= frame; i += Math.max(1, Math.floor(frame / 200))) {
            const tp = traj[i]
            const tm = lngLatAltToMercator(tp.lng, tp.lat, tp.altitude)
            positions.push(
              (tm.x - originMerc.x) / scale,
              tp.altitude,
              -(tm.y - originMerc.y) / scale
            )
          }
          trailRef.current.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
          trailRef.current.geometry.attributes.position.needsUpdate = true
        }

        // Camera matrix from MapLibre
        const m2 = args.defaultProjectionData.mainMatrix
        camera.projectionMatrix = new THREE.Matrix4().fromArray(m2)

        // Model transform
        const modelMatrix = new THREE.Matrix4()
          .makeTranslation(originMerc.x, originMerc.y, originMerc.z as number)
          .scale(new THREE.Vector3(scale, -scale, scale))

        camera.projectionMatrix.multiply(modelMatrix)

        renderer.resetState()
        renderer.render(scene, camera)
        map.current?.triggerRepaint()
      },
    }

    m.addLayer(customLayer)

    // Fit bounds
    const lngs = trajectory.map(p => p.lng).filter(v => v !== 0)
    const lats = trajectory.map(p => p.lat).filter(v => v !== 0)
    if (lngs.length > 0 && lats.length > 0) {
      m.fitBounds(
        [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
        { padding: 80, pitch: 60, bearing: -30, duration: 1500 }
      )
    }
  }, [trajectory, ready])

  return (
    <div ref={mapContainer} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }} />
  )
}
