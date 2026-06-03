import { create } from 'zustand'

export interface TrajectoryPoint {
  time: number
  altitude: number // meters
  east: number // meters from launch site
  north: number // meters from launch site
  lat: number // decimal degrees
  lng: number // decimal degrees
  rollRate: number
  pitchRate: number
  yawRate: number
}

export interface RocketGeometry {
  name: string
  designer: string
  revision: string
  components: {
    name: string
    type: string
    length?: number
    radius?: number
    material?: string
  }[]
}

interface VisualizerStore {
  // Rocket design
  rocketGeometry: RocketGeometry | null
  setRocketGeometry: (geom: RocketGeometry | string) => void

  // Trajectory data
  trajectory: TrajectoryPoint[]
  setTrajectory: (points: TrajectoryPoint[]) => void
  setTrajectoryFromCSV: (data: any[], launchLat: number, launchLng: number) => void

  // Location data
  launchSite: [number, number] | null // [lng, lat]
  setLaunchSite: (coords: [number, number]) => void
  landingSite: [number, number] | null
  setLandingSite: (coords: [number, number]) => void

  // Playback state
  currentFrame: number
  setCurrentFrame: (frame: number) => void
  isPlaying: boolean
  setIsPlaying: (playing: boolean) => void
  playbackSpeed: number
  setPlaybackSpeed: (speed: number) => void

  // UI state
  showTrail: boolean
  setShowTrail: (show: boolean) => void
  showMap: boolean
  setShowMap: (show: boolean) => void
  cameraMode: 'orbit' | 'follow' | 'topdown'
  setCameraMode: (mode: 'orbit' | 'follow' | 'topdown') => void
}

export const useVisualizerStore = create<VisualizerStore>((set) => ({
  rocketGeometry: null,
  setRocketGeometry: (geom) => {
    if (typeof geom === 'string') {
      try {
        const parsed = JSON.parse(geom)
        set({ rocketGeometry: parsed })
      } catch {
        set({ rocketGeometry: null })
      }
    } else {
      set({ rocketGeometry: geom })
    }
  },

  trajectory: [],
  setTrajectory: (points) => set({ trajectory: points }),
  setTrajectoryFromCSV: (data, launchLat, launchLng) => {
    const latPerMeter = 1 / 111000
    const lngPerMeter = 1 / (111000 * Math.cos((launchLat * Math.PI) / 180))

    const points = data.map((row) => ({
      time: row.time,
      altitude: row.altitude,
      east: row.xPos,
      north: row.yPos,
      lat: launchLat + row.yPos * latPerMeter,
      lng: launchLng + row.xPos * lngPerMeter,
      rollRate: row.rollRate || 0,
      pitchRate: row.pitchRate || 0,
      yawRate: row.yawRate || 0,
    }))
    set({ trajectory: points })
  },

  launchSite: null,
  setLaunchSite: (coords) => set({ launchSite: coords }),
  landingSite: null,
  setLandingSite: (coords) => set({ landingSite: coords }),

  currentFrame: 0,
  setCurrentFrame: (frame) => set({ currentFrame: frame }),
  isPlaying: false,
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  playbackSpeed: 1,
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

  showTrail: true,
  setShowTrail: (show) => set({ showTrail: show }),
  showMap: true,
  setShowMap: (show) => set({ showMap: show }),
  cameraMode: 'orbit',
  setCameraMode: (mode) => set({ cameraMode: mode }),
}))
