import { useRef, useEffect } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, Grid, Stars } from '@react-three/drei'
import { useVisualizerStore } from '../store'
import Rocket from './Rocket'
import Trajectory from './Trajectory'
import MotorBurn from './MotorBurn'
import * as THREE from 'three'

function CameraController() {
  const { camera } = useThree()
  const { trajectory, currentFrame } = useVisualizerStore()
  const controlsRef = useRef<any>(null)

  useEffect(() => {
    if (trajectory.length === 0) return

    // Calculate scene bounds from trajectory
    const maxAlt = Math.max(...trajectory.map(p => p.altitude || 0))
    const maxEast = Math.max(...trajectory.map(p => Math.abs(p.east || 0)))
    const maxNorth = Math.max(...trajectory.map(p => Math.abs(p.north || 0)))
    const scale = Math.max(maxAlt, maxEast, maxNorth, 100)

    // Position camera to see full trajectory
    camera.position.set(scale * 0.8, scale * 0.6, scale * 0.8)
    camera.lookAt(0, scale * 0.3, 0)
    camera.updateProjectionMatrix()
  }, [trajectory, camera])

  return <OrbitControls ref={controlsRef} autoRotate autoRotateSpeed={0.3} />
}

export default function Scene() {
  return (
    <Canvas camera={{ position: [500, 400, 500], fov: 50, far: 50000 }}>
      {/* Lighting */}
      <ambientLight intensity={0.7} />
      <directionalLight position={[1000, 1500, 500]} intensity={1} />
      <pointLight position={[-1000, 500, 1000]} intensity={0.5} />

      {/* Environment */}
      <Stars radius={5000} depth={500} count={2000} factor={10} />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
        <planeGeometry args={[10000, 10000]} />
        <meshStandardMaterial color="#1a2a1a" transparent opacity={0.3} />
      </mesh>

      {/* Scene objects */}
      <Rocket />
      <Trajectory />
      <MotorBurn />

      {/* Controls */}
      <CameraController />
    </Canvas>
  )
}
