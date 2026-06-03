import { useRef, useEffect } from 'react'
import { Group, PointLight } from 'three'
import { useVisualizerStore } from '../store'

/**
 * Motor burn visualization
 * Shows flame effect during powered ascent
 */
export default function MotorBurn() {
  const groupRef = useRef<Group>(null)
  const lightRef = useRef<PointLight>(null)
  const { trajectory, currentFrame } = useVisualizerStore()

  useEffect(() => {
    if (!groupRef.current || !lightRef.current || trajectory.length === 0) return

    const point = trajectory[currentFrame]
    const nextPoint = currentFrame < trajectory.length - 1 ? trajectory[currentFrame + 1] : point

    // Check if rocket is still ascending (burnout detection)
    const isAscending = nextPoint.altitude > point.altitude
    const isLowAltitude = point.altitude < 5 // Only show flame at low altitude for demo

    groupRef.current.position.set(point.east, point.altitude, point.north)

    // Flame effect: visible only during ascent
    if (isAscending && !isLowAltitude) {
      lightRef.current.intensity = 2 + Math.sin(point.time * 10) * 0.5 // Flicker
      lightRef.current.distance = 50
    } else {
      lightRef.current.intensity = 0
    }
  }, [trajectory, currentFrame])

  return (
    <group ref={groupRef}>
      {/* Flame particle effect light */}
      <pointLight ref={lightRef} color="#ff4400" />

      {/* Flame mesh (simplified) */}
      <mesh position={[0, -1, 0]}>
        <coneGeometry args={[0.3, 2, 8]} />
        <meshBasicMaterial color="#ffaa00" wireframe opacity={0.6} />
      </mesh>
    </group>
  )
}
