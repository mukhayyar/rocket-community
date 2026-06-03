import { useVisualizerStore } from '../store'

export default function Controls() {
  const {
    trajectory,
    currentFrame,
    setCurrentFrame,
    isPlaying,
    setIsPlaying,
    playbackSpeed,
    setPlaybackSpeed,
    showTrail,
    setShowTrail,
    showMap,
    setShowMap,
  } = useVisualizerStore()

  if (trajectory.length === 0) return null

  const maxFrame = trajectory.length - 1
  const currentPoint = trajectory[currentFrame]

  // Calculate max altitude and current distance
  const maxAlt = Math.max(...trajectory.map(p => p.altitude))
  const distance = Math.sqrt(currentPoint.east ** 2 + currentPoint.north ** 2)

  return (
    <div style={{
      position: 'absolute',
      bottom: 20,
      left: 20,
      right: 390,
      background: 'rgba(0,0,0,0.85)',
      color: '#0f0',
      padding: '15px',
      borderRadius: '8px',
      fontFamily: 'monospace',
      fontSize: '13px',
      zIndex: 10,
      border: '1px solid #0f0',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
        <div>
          <strong>✈️ Time:</strong> {currentPoint.time.toFixed(1)}s
        </div>
        <div>
          <strong>📍 Lat/Lng:</strong> {currentPoint.lat.toFixed(5)}°, {currentPoint.lng.toFixed(5)}°
        </div>
        <div>
          <strong>📈 Altitude:</strong> {currentPoint.altitude.toFixed(1)}m (max: {maxAlt.toFixed(0)}m)
        </div>
        <div>
          <strong>📏 Distance:</strong> {distance.toFixed(0)}m
        </div>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <input
          type="range"
          min="0"
          max={maxFrame}
          value={currentFrame}
          onChange={(e) => setCurrentFrame(parseInt(e.target.value))}
          style={{ width: '100%' }}
        />
        <div style={{ textAlign: 'center', fontSize: '11px' }}>
          Frame {currentFrame} / {maxFrame}
        </div>
      </div>

      <div style={{ marginBottom: '10px', display: 'flex', gap: '10px' }}>
        <button onClick={() => setIsPlaying(!isPlaying)}>
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>
        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}>
          Speed:
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
            style={{ width: '100px' }}
          />
          {playbackSpeed.toFixed(1)}x
        </label>
      </div>

      <div style={{ display: 'flex', gap: '15px', fontSize: '12px' }}>
        <label>
          <input type="checkbox" checked={showTrail} onChange={(e) => setShowTrail(e.target.checked)} />
          {' '}Show Trail
        </label>
        <label>
          <input type="checkbox" checked={showMap} onChange={(e) => setShowMap(e.target.checked)} />
          {' '}Show Map
        </label>
      </div>
    </div>
  )
}
