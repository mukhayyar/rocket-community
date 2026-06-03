import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Stars } from '@react-three/drei'
import { useVisualizerStore } from '../store'
import Rocket from './Rocket'
import Trajectory from './Trajectory'
import MotorBurn from './MotorBurn'

export default function Scene() {
  const { cameraMode } = useVisualizerStore()

  return (
    <Canvas camera={{ position: [150, 100, 150], fov: 50 }}>
      {/* Lighting */}
      <ambientLight intensity={0.7} />
      <directionalLight position={[100, 150, 50]} intensity={1} />
      <pointLight position={[-100, 50, 100]} intensity={0.5} />

      {/* Environment */}
      <Stars radius={500} depth={100} count={1000} factor={4} />
      <axesHelper args={[200]} />
      <Grid args={[400, 400]} cellSize={10} cellColor="#0f0" sectionSize={100} sectionColor="#00ff00" />

      {/* Scene objects */}
      <Rocket />
      <Trajectory />
      <MotorBurn />

      {/* Controls */}
      <OrbitControls autoRotate autoRotateSpeed={0.5} />
    </Canvas>
  )
}
