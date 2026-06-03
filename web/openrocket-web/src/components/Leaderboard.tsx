import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'

interface LeaderboardEntry {
  rocketId: string
  rocketName: string
  designer: string
  value: number
}

type Category = 'altitude' | 'distance' | 'duration'

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [category, setCategory] = useState<Category>('altitude')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch(api.leaderboards.get(category))
        const data = await response.json()
        setEntries(Array.isArray(data) ? data : data.leaderboard || [])
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error)
      } finally {
        setLoading(false)
      }
    }

    setLoading(true)
    fetchLeaderboard()
  }, [category])

  const medals = ['🥇', '🥈', '🥉']

  if (loading) return <div className="p-8 text-center">Loading leaderboard...</div>

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">Leaderboard</h1>
        <p className="text-slate-300 mb-8">Top performing rockets</p>

        <div className="flex gap-2 mb-8">
          {(['altitude', 'distance', 'duration'] as Category[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                category === cat
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        <div className="bg-slate-700 rounded-lg overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-800 font-semibold text-slate-300 border-b border-slate-600">
            <div className="col-span-1">Rank</div>
            <div className="col-span-5">Rocket</div>
            <div className="col-span-3">Designer</div>
            <div className="col-span-3">
              {category === 'altitude' && 'Max Altitude'}
              {category === 'distance' && 'Max Distance'}
              {category === 'duration' && 'Flight Time'}
            </div>
          </div>

          {entries.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-400">
              No rockets in this category yet
            </div>
          ) : (
            entries.map((entry, index) => (
              <Link
                key={entry.rocketId}
                to={`/rocket/${entry.rocketId}`}
                className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-600 hover:bg-slate-600 transition text-white"
              >
                <div className="col-span-1 font-bold text-lg">
                  {index < 3 ? medals[index] : `#${index + 1}`}
                </div>
                <div className="col-span-5 font-semibold">{entry.rocketName}</div>
                <div className="col-span-3 text-slate-300">{entry.designer}</div>
                <div className="col-span-3 text-orange-400 font-semibold">
                  {category === 'altitude' && `${entry.value.toLocaleString()} m`}
                  {category === 'distance' && `${entry.value.toLocaleString()} m`}
                  {category === 'duration' && `${entry.value.toFixed(1)} s`}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
