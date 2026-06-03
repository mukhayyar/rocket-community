import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'

interface RocketCard {
  id: string
  name: string
  designer: string
  maxAltitude: number
  maxDistance: number
  flightTime: number
  views: number
  featured: boolean
}

type SortOption = 'recent' | 'trending' | 'altitude' | 'distance'

export default function Gallery() {
  const [rockets, setRockets] = useState<RocketCard[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<SortOption>('recent')

  useEffect(() => {
    const fetchRockets = async () => {
      try {
        const response = await fetch(api.rockets.list(sortBy))
        const data = await response.json()
        setRockets(Array.isArray(data) ? data : data.rockets || [])
      } catch (error) {
        console.error('Failed to fetch rockets:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRockets()
  }, [sortBy])

  if (loading) return <div className="p-8 text-center">Loading gallery...</div>

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Rocket Community</h1>
            <p className="text-slate-300">{rockets.length} rockets shared</p>
          </div>
          <Link
            to="/upload"
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            + Upload Rocket
          </Link>
        </div>

        <div className="flex gap-2 mb-8">
          {(['recent', 'trending', 'altitude', 'distance'] as SortOption[]).map((option) => (
            <button
              key={option}
              onClick={() => setSortBy(option)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                sortBy === option
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
              }`}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rockets.map((rocket) => (
            <Link
              key={rocket.id}
              to={`/rocket/${rocket.id}`}
              className="bg-slate-700 rounded-lg overflow-hidden hover:transform hover:scale-105 transition"
            >
              <div className="bg-gradient-to-b from-blue-600 to-blue-900 h-48 flex items-center justify-center">
                <div className="text-4xl">🚀</div>
              </div>
              <div className="p-4">
                {rocket.featured && <div className="text-sm bg-yellow-500 text-black px-2 py-1 rounded mb-2 inline-block">Featured</div>}
                <h3 className="text-xl font-bold text-white mb-1">{rocket.name}</h3>
                <p className="text-slate-300 text-sm mb-3">by {rocket.designer}</p>
                <div className="grid grid-cols-3 gap-2 text-sm text-slate-300">
                  <div>
                    <div className="font-semibold text-orange-400">{rocket.maxAltitude.toLocaleString()}m</div>
                    <div>Altitude</div>
                  </div>
                  <div>
                    <div className="font-semibold text-orange-400">{rocket.maxDistance.toLocaleString()}m</div>
                    <div>Distance</div>
                  </div>
                  <div>
                    <div className="font-semibold text-orange-400">{rocket.flightTime.toFixed(1)}s</div>
                    <div>Time</div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-slate-400">👁 {rocket.views} views</div>
              </div>
            </Link>
          ))}
        </div>

        {rockets.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-300 text-lg mb-4">No rockets yet. Be the first to upload!</p>
            <Link
              to="/upload"
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg font-semibold transition inline-block"
            >
              Upload Your First Rocket
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
