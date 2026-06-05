import { useRef, useEffect, useMemo } from 'react'
import { Group, Mesh, ConeGeometry, CylinderGeometry, MeshStandardMaterial, BoxGeometry } from 'three'
import { useVisualizerStore } from '../store'

export default function Rocket() {
  const groupRef = useRef<Group>(null)
  const { trajectory, currentFrame, rocketGeometry } = useVisualizerStore()

  // Build rocket from geometry components
  const rocketMeshes = useMemo(() => {
    if (!rocketGeometry?.components) return null

    let yOffset = 0
    const meshes = []

    for (const comp of rocketGeometry.components) {
      const length = comp.length || 0.5
      const radius = comp.radius || 0.5

      switch (comp.type) {
        case 'nosecone':
          meshes.push({
            type: 'cone',
            position: [0, yOffset + length / 2, 0],
            args: [radius, length, 16],
            color: '#ff6b00',
            label: comp.name,
          })
          yOffset += length
          break

        case 'bodytube':
          meshes.push({
            type: 'cylinder',
            position: [0, yOffset + length / 2, 0],
            args: [radius, radius, length, 16],
            color: '#333333',
            label: comp.name,
          })
          yOffset += length
          break

        case 'fin':
          meshes.push({
            type: 'fin',
            position: [radius * 0.8, yOffset, 0],
            args: [0.1, length * 0.5, 0.3],
            color: '#1a1a1a',
            label: comp.name,
          })
          break

        case 'motor':
          meshes.push({
            type: 'cylinder',
            position: [0, yOffset, 0],
            args: [radius * 0.9, radius * 0.9, 0.5, 16],
            color: '#666666',
            label: comp.name,
          })
          break
      }
    }

    return meshes
  }, [rocketGeometry])

  // Update position and rotation from trajectory
  useEffect(() => {
    if (!groupRef.current || trajectory.length === 0 || currentFrame >= trajectory.length) {
      return
    }

    const point = trajectory[currentFrame]
    groupRef.current.position.set(point.east, point.altitude, point.north)

    // Convert angular rates to rotation (simplified)
    // TODO: Integrate rotation properly over time
    groupRef.current.rotation.order = 'YXZ'
    groupRef.current.rotation.y = Math.sin(point.time * 0.5) * point.yawRate * 0.1
    groupRef.current.rotation.x = Math.sin(point.time * 0.3) * point.pitchRate * 0.1
    groupRef.current.rotation.z = Math.sin(point.time * 0.7) * point.rollRate * 0.1
  }, [trajectory, currentFrame])

  // Scale rocket relative to trajectory size
  const rocketScale = useMemo(() => {
    if (trajectory.length === 0) return 1
    const maxAlt = Math.max(...trajectory.map(p => p.altitude || 0), 100)
    return Math.max(maxAlt / 100, 2) // ~1% of max altitude, min 2
  }, [trajectory])

  if (!rocketMeshes || rocketMeshes.length === 0) {
    // Fallback simplified rocket
    return (
      <group ref={groupRef} scale={[rocketScale, rocketScale, rocketScale]}>
        <mesh position={[0, 1.5, 0]}>
          <coneGeometry args={[0.5, 1.5, 16]} />
          <meshStandardMaterial color="#ff6b00" emissive="#ff3300" emissiveIntensity={0.3} />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.5, 0.5, 2.5, 16]} />
          <meshStandardMaterial color="#444444" metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[0.8, -0.5, 0]}>
          <boxGeometry args={[0.1, 1.5, 0.5]} />
          <meshStandardMaterial color="#222222" />
        </mesh>
        <mesh position={[-0.8, -0.5, 0]}>
          <boxGeometry args={[0.1, 1.5, 0.5]} />
          <meshStandardMaterial color="#222222" />
        </mesh>
        <mesh position={[0, -0.5, 0.8]}>
          <boxGeometry args={[0.5, 1.5, 0.1]} />
          <meshStandardMaterial color="#222222" />
        </mesh>
      </group>
    )
  }

  return (
    <group ref={groupRef}>
      {rocketMeshes.map((mesh, i) => (
        <mesh key={i} position={mesh.position as any}>
          {mesh.type === 'cone' && <coneGeometry args={mesh.args as any} />}
          {mesh.type === 'cylinder' && <cylinderGeometry args={mesh.args as any} />}
          {mesh.type === 'fin' && <boxGeometry args={mesh.args as any} />}
          <meshStandardMaterial color={mesh.color} />
        </mesh>
      ))}
    </group>
  )
}
