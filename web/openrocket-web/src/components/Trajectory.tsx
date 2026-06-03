import { useMemo } from 'react'
import { Line } from '@react-three/drei'
import { useVisualizerStore } from '../store'

export default function Trajectory() {
  const { trajectory, showTrail, currentFrame } = useVisualizerStore()

  const trailPoints = useMemo(() => {
    if (!showTrail || trajectory.length === 0) return []
    
    return trajectory.slice(0, currentFrame + 1).map(point => [
      point.east,
      point.altitude,
      point.north,
    ])
  }, [trajectory, showTrail, currentFrame])

  if (trailPoints.length === 0) return null

  return <Line points={trailPoints as any} color="#00ff00" lineWidth={2} />
}
