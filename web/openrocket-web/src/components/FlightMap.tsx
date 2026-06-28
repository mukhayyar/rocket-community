import { useEffect, useRef, useState } from 'react'
import maplibre from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import * as THREE from 'three'
import { useVisualizerStore } from '../store'

export default function FlightMap() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibre.Map | null>(null)
  const [ready, setReady] = useState(false)
  const threeState = useRef<{
    renderer: THREE.WebGLRenderer | null
    scene: THREE.Scene
    camera: THREE.Camera
    rocket: THREE.Group
    trail: THREE.Line
    flame: THREE.Mesh
    flameLight: THREE.PointLight
    originMerc: maplibre.MercatorCoordinate
    scale: number
  } | null>(null)
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
          maxzoom: 24,
        }],
      },
      center: center as [number, number],
      zoom: 14,
      maxZoom: 24,
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
      threeState.current = null
    }
  }, [launchSite])

  // Setup Three.js + trajectory when map ready + trajectory loaded
  useEffect(() => {
    if (!map.current || !ready || trajectory.length === 0) return
    const m = map.current

    // Clean old layers
    try {
      ['3d-rocket', 'trajectory-ground', 'launch-point', 'landing-point'].forEach(id => {
        if (m.getLayer(id)) m.removeLayer(id)
      });
      ['trajectory-src', 'launch-src', 'landing-src'].forEach(id => {
        if (m.getSource(id)) m.removeSource(id)
      })
    } catch {}

    const origin = trajectory[0]
    const originMerc = maplibre.MercatorCoordinate.fromLngLat([origin.lng, origin.lat], 0)
    const scale = originMerc.meterInMercatorCoordinateUnits()

    // Ground track (dashed 2D line)
    m.addSource('trajectory-src', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: trajectory.map(p => [p.lng, p.lat]) },
        properties: {},
      },
    })
    m.addLayer({
      id: 'trajectory-ground',
      type: 'line',
      source: 'trajectory-src',
      paint: { 'line-color': '#00ff88', 'line-width': 2, 'line-opacity': 0.3, 'line-dasharray': [2, 2] },
    })

    // Markers
    m.addSource('launch-src', {
      type: 'geojson',
      data: { type: 'Feature', geometry: { type: 'Point', coordinates: [origin.lng, origin.lat] }, properties: {} },
    })
    m.addLayer({
      id: 'launch-point', type: 'circle', source: 'launch-src',
      paint: { 'circle-radius': 7, 'circle-color': '#00ff88', 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 },
    })

    const last = trajectory[trajectory.length - 1]
    m.addSource('landing-src', {
      type: 'geojson',
      data: { type: 'Feature', geometry: { type: 'Point', coordinates: [last.lng, last.lat] }, properties: {} },
    })
    m.addLayer({
      id: 'landing-point', type: 'circle', source: 'landing-src',
      paint: { 'circle-radius': 7, 'circle-color': '#ff4444', 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 },
    })

    // === THREE.JS 3D LAYER ===
    const scene = new THREE.Scene()
    const camera = new THREE.Camera()

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.7))
    const dir = new THREE.DirectionalLight(0xffffff, 0.8)
    dir.position.set(0, 1, 0)
    scene.add(dir)

    // Rocket
    const rocket = new THREE.Group()

    const nose = new THREE.Mesh(
      new THREE.ConeGeometry(0.3, 1, 12),
      new THREE.MeshPhongMaterial({ color: 0xff6b00, emissive: 0xff3300, emissiveIntensity: 0.2 })
    )
    nose.position.y = 2
    rocket.add(nose)

    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 2, 12),
      new THREE.MeshPhongMaterial({ color: 0x555555, shininess: 50 })
    )
    body.position.y = 0.8
    rocket.add(body)

    for (let i = 0; i < 4; i++) {
      const fin = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.8, 0.4),
        new THREE.MeshPhongMaterial({ color: 0x222222 })
      )
      const a = (i / 4) * Math.PI * 2
      fin.position.set(Math.cos(a) * 0.4, -0.1, Math.sin(a) * 0.4)
      fin.rotation.y = a
      rocket.add(fin)
    }

    // Flame
    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.2, 1.2, 8),
      new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.8 })
    )
    flame.position.y = -0.8
    flame.rotation.x = Math.PI
    rocket.add(flame)

    const flameLight = new THREE.PointLight(0xff4400, 2, 300)
    flameLight.position.y = -0.8
    rocket.add(flameLight)

    scene.add(rocket)

    // 3D Trail
    const trailGeo = new THREE.BufferGeometry()
    const trailMat = new THREE.LineBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.8,
    })
    const trail = new THREE.Line(trailGeo, trailMat)
    scene.add(trail)

    // Pre-compute ALL trajectory positions in Three.js space
    const allPositions = trajectory.map(p => {
      const merc = maplibre.MercatorCoordinate.fromLngLat([p.lng, p.lat], p.altitude)
      return new THREE.Vector3(
        (merc.x - originMerc.x) / scale,
        (merc.y - originMerc.y) / scale,
        p.altitude
      )
    })

    // Full predicted path (faded)
    const fullPathGeo = new THREE.BufferGeometry()
    const fullPos = new Float32Array(allPositions.length * 3)
    allPositions.forEach((v, i) => { fullPos[i * 3] = v.x; fullPos[i * 3 + 1] = v.z; fullPos[i * 3 + 2] = -v.y })
    fullPathGeo.setAttribute('position', new THREE.BufferAttribute(fullPos, 3))
    const fullPath = new THREE.Line(fullPathGeo, new THREE.LineBasicMaterial({
      color: 0x4488ff, transparent: true, opacity: 0.15,
    }))
    scene.add(fullPath)

    // Vertical drop lines every N frames (altitude reference)
    const dropInterval = Math.max(1, Math.floor(trajectory.length / 20))
    for (let i = 0; i < trajectory.length; i += dropInterval) {
      const p = allPositions[i]
      const dropGeo = new THREE.BufferGeometry()
      dropGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
        p.x, p.z, -p.y,
        p.x, 0, -p.y,
      ]), 3))
      const drop = new THREE.Line(dropGeo, new THREE.LineBasicMaterial({
        color: 0xffffff, transparent: true, opacity: 0.08,
      }))
      scene.add(drop)
    }

    let renderer: THREE.WebGLRenderer

    threeState.current = { renderer: null, scene, camera, rocket, trail, flame, flameLight, originMerc, scale }

    const customLayer: maplibre.CustomLayerInterface = {
      id: '3d-rocket',
      type: 'custom',
      renderingMode: '3d',

      onAdd(_map, gl) {
        renderer = new THREE.WebGLRenderer({ canvas: _map.getCanvas(), context: gl, antialias: true })
        renderer.autoClear = false
        if (threeState.current) threeState.current.renderer = renderer
      },

      render(_gl, args) {
        if (!threeState.current?.renderer) return

        const store = useVisualizerStore.getState()
        const frame = Math.min(store.currentFrame, allPositions.length - 1)
        const pos = allPositions[frame]

        // Position rocket (x = east, z = altitude, -y = north in Three.js space)
        rocket.position.set(pos.x, pos.z, -pos.y)

        // Orient rocket along flight direction
        if (frame > 0 && frame < allPositions.length - 1) {
          const prev = allPositions[Math.max(0, frame - 1)]
          const next = allPositions[Math.min(frame + 1, allPositions.length - 1)]
          const dx = next.x - prev.x
          const dy = next.z - prev.z  // altitude
          const dz = -(next.y - prev.y)
          const len = Math.sqrt(dx * dx + dy * dy + dz * dz)
          if (len > 0.001) {
            const dir = new THREE.Vector3(dx / len, dy / len, dz / len)
            const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
            rocket.quaternion.slerp(q, 0.15)
          }
        }

        // Flame during ascent
        const ascending = frame > 0 && trajectory[frame].altitude > trajectory[frame - 1]?.altitude
        const thrustPhase = frame < trajectory.length * 0.15 // ~first 15% = powered flight
        flame.visible = ascending && thrustPhase
        flameLight.intensity = flame.visible ? 2 + Math.sin(Date.now() * 0.02) * 1.5 : 0
        if (flame.visible) {
          flame.scale.y = 0.8 + Math.sin(Date.now() * 0.03) * 0.3
        }

        // Update trail (path traveled so far) — real 3D
        if (frame > 1) {
          const step = Math.max(1, Math.floor(frame / 500))
          const trailPositions: number[] = []
          for (let i = 0; i <= frame; i += step) {
            const tp = allPositions[i]
            trailPositions.push(tp.x, tp.z, -tp.y)
          }
          // Always include current frame
          trailPositions.push(pos.x, pos.z, -pos.y)
          trail.geometry.setAttribute('position', new THREE.Float32BufferAttribute(trailPositions, 3))
          trail.geometry.computeBoundingSphere()
        }

        // Camera matrix
        const rotationX = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2)
        const modelTransform = new THREE.Matrix4()
          .makeTranslation(originMerc.x, originMerc.y, originMerc.z as number)
          .scale(new THREE.Vector3(scale, -scale, scale))
          .multiply(rotationX)

        camera.projectionMatrix = new THREE.Matrix4().fromArray(
          (args as any).defaultProjectionData?.mainMatrix || (args as any).projectionMatrix || []
        ).multiply(modelTransform)

        renderer.resetState()
        renderer.render(scene, camera)
        map.current?.triggerRepaint()
      },
    }

    m.addLayer(customLayer)

    // Fit bounds
    const lngs = trajectory.map(p => p.lng).filter(v => v !== 0)
    const lats = trajectory.map(p => p.lat).filter(v => v !== 0)
    if (lngs.length > 1) {
      m.fitBounds(
        [[Math.min(...lngs) - 0.005, Math.min(...lats) - 0.005], [Math.max(...lngs) + 0.005, Math.max(...lats) + 0.005]],
        { padding: 60, pitch: 60, bearing: -30, duration: 2000 }
      )
    }
  }, [trajectory, ready])

  return (
    <div ref={mapContainer} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }} />
  )
}
