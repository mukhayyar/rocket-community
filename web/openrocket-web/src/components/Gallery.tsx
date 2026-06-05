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

  if (loading) return <div className="p-8 text-center text-slate-300">Loading gallery...</div>
  if (!loading && rockets.length === 0 && sortBy === 'recent') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 px-4 py-6 sm:p-8">
        <div className="max-w-7xl mx-auto text-center py-20">
          <div className="text-6xl mb-6">🚀</div>
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-4">Rocket Community</h1>
          <p className="text-slate-300 text-lg mb-8">No rockets yet. Be the first to upload!</p>
          <Link to="/upload" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg font-semibold transition inline-block">
            Upload Your First Rocket
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 px-4 py-6 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold text-white mb-1">Rocket Community</h1>
            <p className="text-slate-300 text-sm sm:text-base">{rockets.length} rockets shared</p>
          </div>
          <Link
            to="/upload"
            className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 sm:px-6 sm:py-3 rounded-lg font-semibold transition text-center text-sm sm:text-base"
          >
            + Upload Rocket
          </Link>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-1 px-1">
          {(['recent', 'trending', 'altitude', 'distance'] as SortOption[]).map((option) => (
            <button
              key={option}
              onClick={() => setSortBy(option)}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium transition text-sm whitespace-nowrap ${
                sortBy === option
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
              }`}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {rockets.map((rocket) => (
            <Link
              key={rocket.id}
              to={`/rocket/${rocket.id}`}
              className="bg-slate-700 rounded-lg overflow-hidden active:scale-[0.98] sm:hover:scale-105 transition"
            >
              <div className="bg-gradient-to-b from-blue-600 to-blue-900 h-32 sm:h-48 flex items-center justify-center">
                <div className="text-3xl sm:text-4xl">🚀</div>
              </div>
              <div className="p-3 sm:p-4">
                {rocket.featured && <div className="text-xs sm:text-sm bg-yellow-500 text-black px-2 py-0.5 rounded mb-2 inline-block">Featured</div>}
                <h3 className="text-lg sm:text-xl font-bold text-white mb-1 truncate">{rocket.name}</h3>
                <p className="text-slate-300 text-xs sm:text-sm mb-2 sm:mb-3">by {rocket.designer}</p>
                <div className="grid grid-cols-3 gap-1 sm:gap-2 text-xs sm:text-sm text-slate-300">
                  <div>
                    <div className="font-semibold text-orange-400">{(rocket.maxAltitude ?? 0).toLocaleString()}m</div>
                    <div>Altitude</div>
                  </div>
                  <div>
                    <div className="font-semibold text-orange-400">{(rocket.maxDistance ?? 0).toLocaleString()}m</div>
                    <div>Distance</div>
                  </div>
                  <div>
                    <div className="font-semibold text-orange-400">{(rocket.flightTime ?? 0).toFixed(1)}s</div>
                    <div>Time</div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-slate-400">👁 {rocket.views} views</div>
              </div>
            </Link>
          ))}
        </div>

        {rockets.length === 0 && (
          <div className="text-center py-12 sm:py-16">
            <p className="text-slate-300 text-base sm:text-lg mb-4">No rockets yet. Be the first to upload!</p>
            <Link
              to="/upload"
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-lg font-semibold transition inline-block"
            >
              Upload Your First Rocket
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
