import { useRef, useState } from 'react'
import { useVisualizerStore } from '../store'
import { parseCSV } from '../lib/csvParser'
import { parseORK, orkToGeometry } from '../lib/orkParser'

export default function FileUpload() {
  const csvInputRef = useRef<HTMLInputElement>(null)
  const orkInputRef = useRef<HTMLInputElement>(null)
  const [launchLat, setLaunchLat] = useState('0')
  const [launchLng, setLaunchLng] = useState('0')
  const [csvLoaded, setCsvLoaded] = useState(false)
  const [orkLoaded, setOrkLoaded] = useState(false)
  const { setTrajectory, setRocketGeometry, setLaunchSite } = useVisualizerStore()

  const handleCSVUpload = async (file: File) => {
    try {
      const text = await file.text()
      const lat = parseFloat(launchLat) || 0
      const lng = parseFloat(launchLng) || 0
      const points = parseCSV(text, lat, lng)
      setTrajectory(points)
      setLaunchSite([lng, lat])
      setCsvLoaded(true)
      console.log(`✅ Loaded CSV: ${points.length} trajectory points`)
    } catch (err) {
      console.error('CSV parsing error:', err)
    }
  }

  const handleORKUpload = async (file: File) => {
    try {
      const text = await file.text()
      const parsed = await parseORK(text)
      if (parsed) {
        const geom = orkToGeometry(parsed)
        setRocketGeometry(geom)
        setOrkLoaded(true)
        console.log(`✅ Loaded ORK: ${parsed.name} with ${parsed.components.length} components`)
      }
    } catch (err) {
      console.error('ORK parsing error:', err)
    }
  }

  return (
    <div style={{
      position: 'absolute',
      top: 20,
      left: 20,
      background: 'rgba(0,0,0,0.95)',
      color: '#0f0',
      padding: '20px',
      borderRadius: '8px',
      zIndex: 10,
      maxWidth: '420px',
      border: '2px solid #0f0',
      boxShadow: '0 0 10px #0f0',
    }}>
      <h2 style={{ textShadow: '0 0 10px #0f0', marginBottom: '10px' }}>🚀 OpenRocket Web</h2>
      <p style={{ fontSize: '11px', color: '#888', marginBottom: '15px' }}>
        3D trajectory + terrain visualization
      </p>

      <div style={{ marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #0f0' }}>
        <div style={{ marginBottom: '8px' }}>
          <label style={{ fontSize: '11px' }}>
            📍 Launch Latitude:
            <input
              type="number"
              value={launchLat}
              onChange={(e) => setLaunchLat(e.target.value)}
              placeholder="0.0"
              step="0.001"
              style={{ width: '90px', marginLeft: '8px', padding: '4px' }}
            />
          </label>
        </div>
        <div>
          <label style={{ fontSize: '11px' }}>
            📍 Launch Longitude:
            <input
              type="number"
              value={launchLng}
              onChange={(e) => setLaunchLng(e.target.value)}
              placeholder="0.0"
              step="0.001"
              style={{ width: '90px', marginLeft: '8px', padding: '4px' }}
            />
          </label>
        </div>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px' }}>
          📊 Flight Data (CSV): {csvLoaded && '✅'}
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv"
            onChange={(e) => e.target.files?.[0] && handleCSVUpload(e.target.files[0])}
            style={{ marginLeft: '5px', display: 'block', marginTop: '5px', fontSize: '11px' }}
          />
        </label>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '12px' }}>
          🛸 Rocket Design (ORK): {orkLoaded && '✅'}
          <input
            ref={orkInputRef}
            type="file"
            accept=".ork"
            onChange={(e) => e.target.files?.[0] && handleORKUpload(e.target.files[0])}
            style={{ marginLeft: '5px', display: 'block', marginTop: '5px', fontSize: '11px' }}
          />
        </label>
      </div>
    </div>
  )
}
