import { useMemo } from 'react'
import { useVisualizerStore } from '../store'

export default function Dashboard() {
  const { trajectory, currentFrame, rocketGeometry } = useVisualizerStore()

  const stats = useMemo(() => {
    if (trajectory.length === 0) return null

    const maxAlt = Math.max(...trajectory.map(p => p.altitude))
    const maxDist = Math.max(...trajectory.map(p => Math.sqrt(p.east ** 2 + p.north ** 2)))
    const flightTime = trajectory[trajectory.length - 1].time
    const currentPoint = trajectory[currentFrame]
    const burnoutAlt = trajectory.find(p => p.altitude < trajectory[0]?.altitude)?.altitude || 0
    const apogeeTime = trajectory[trajectory.findIndex(p => p.altitude === maxAlt)]?.time || 0

    return {
      maxAlt,
      maxDist,
      flightTime,
      apogeeTime,
      burnoutAlt,
      currentAlt: currentPoint.altitude,
      currentDist: Math.sqrt(currentPoint.east ** 2 + currentPoint.north ** 2),
    }
  }, [trajectory, currentFrame])

  if (!stats) return null

  const progress = ((currentFrame / (trajectory.length - 1)) * 100).toFixed(1)

  return (
    <div style={{
      position: 'absolute',
      top: 20,
      right: 20,
      background: 'rgba(0,0,0,0.9)',
      color: '#0f0',
      padding: '15px',
      borderRadius: '8px',
      fontFamily: 'monospace',
      fontSize: '12px',
      zIndex: 10,
      border: '1px solid #0f0',
      maxWidth: '320px',
    }}>
      <h3 style={{ marginBottom: '10px', fontSize: '14px' }}>📊 Flight Analytics</h3>

      {rocketGeometry && (
        <div style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #0f0' }}>
          <div><strong>🛸 Rocket:</strong> {rocketGeometry.name}</div>
          <div style={{ fontSize: '11px', color: '#888' }}>by {rocketGeometry.designer}</div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
        <div>
          <div style={{ color: '#888', fontSize: '10px' }}>Max Altitude</div>
          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{stats.maxAlt.toFixed(0)}m</div>
        </div>
        <div>
          <div style={{ color: '#888', fontSize: '10px' }}>Apogee Time</div>
          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{stats.apogeeTime.toFixed(1)}s</div>
        </div>
        <div>
          <div style={{ color: '#888', fontSize: '10px' }}>Total Distance</div>
          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{stats.maxDist.toFixed(0)}m</div>
        </div>
        <div>
          <div style={{ color: '#888', fontSize: '10px' }}>Flight Time</div>
          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{stats.flightTime.toFixed(1)}s</div>
        </div>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <div style={{ color: '#888', fontSize: '10px', marginBottom: '3px' }}>Progress: {progress}%</div>
        <div style={{
          width: '100%',
          height: '6px',
          background: '#1a1a1a',
          borderRadius: '3px',
          overflow: 'hidden',
          border: '1px solid #0f0',
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: '#0f0',
            transition: 'width 0.1s',
          }} />
        </div>
      </div>

      <div style={{
        fontSize: '10px',
        color: '#888',
        paddingTop: '10px',
        borderTop: '1px solid #0f0',
      }}>
        <div>Components: {rocketGeometry?.components.length || 0}</div>
        <div>Data Points: {trajectory.length}</div>
      </div>
    </div>
  )
}
