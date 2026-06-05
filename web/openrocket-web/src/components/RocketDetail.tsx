import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useVisualizerStore } from '../store'
import { api } from '../lib/api'
import Scene from './Scene'
import Dashboard from './Dashboard'
import Controls from './Controls'

interface Rocket {
  id: string
  name: string
  designer: string
  description?: string
  maxAltitude: number
  maxDistance: number
  flightTime: number
  views: number
  featured: boolean
}

interface Comment {
  id: string
  author: string
  text: string
  rating: number
  createdAt: string
}

export default function RocketDetail() {
  const { id } = useParams<{ id: string }>()
  const { setTrajectoryFromCSV, setRocketGeometry } = useVisualizerStore()
  const [rocket, setRocket] = useState<Rocket | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newComment, setNewComment] = useState({ author: '', text: '', rating: 5 })
  const [submittingComment, setSubmittingComment] = useState(false)

  useEffect(() => {
    const fetchRocket = async () => {
      try {
        const response = await fetch(api.rockets.get(id || ''))
        if (!response.ok) throw new Error('Rocket not found')

        const data = await response.json()
        setRocket(data)
        setComments(data.comments || [])

        // Load flight data separately (heavy payload)
        const dataResponse = await fetch(api.rockets.data(id || ''))
        if (dataResponse.ok) {
          const flightData = await dataResponse.json()

          if (flightData.csvData) {
            const csvLines = flightData.csvData.split('\n').filter((line: string) => line.trim())
            const trajectory = csvLines.map((line: string) => {
              const [time, altitude, xPos, yPos, rollRate, pitchRate, yawRate] = line.split(',').map(Number)
              return { time, altitude, xPos, yPos, rollRate, pitchRate, yawRate }
            })
            setTrajectoryFromCSV(trajectory, flightData.launchLat, flightData.launchLng)
          }

          if (flightData.orkData) {
            setRocketGeometry(flightData.orkData)
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load rocket')
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchRocket()
  }, [id, setTrajectoryFromCSV, setRocketGeometry])

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.text.trim()) return

    setSubmittingComment(true)
    try {
      const response = await fetch(api.rockets.comment(id || ''), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newComment),
      })

      if (!response.ok) throw new Error('Failed to submit comment')

      const comment = await response.json()
      setComments((prev) => [comment, ...prev])
      setNewComment({ author: '', text: '', rating: 5 })
    } catch (err) {
      console.error('Comment error:', err)
    } finally {
      setSubmittingComment(false)
    }
  }

  if (loading) return <div className="p-8 text-center">Loading rocket...</div>
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>
  if (!rocket) return <div className="p-8 text-center">Rocket not found</div>

  return (
    <div className="bg-black">
      {/* 3D Visualization */}
      <div style={{ width: '100vw', height: '40vh', minHeight: '250px', overflow: 'hidden' }} className="sm:!h-[60vh]">
        <Scene />
        <Dashboard />
        <Controls />
      </div>

      {/* Details Section */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-6 sm:px-8 sm:py-12">
          <div className="grid grid-cols-3 gap-2 sm:gap-8 mb-6 sm:mb-12">
            <div className="bg-slate-700 rounded-lg p-3 sm:p-6">
              <div className="text-slate-400 text-xs sm:text-sm mb-1">Max Altitude</div>
              <div className="text-lg sm:text-3xl font-bold text-orange-400">{rocket.maxAltitude.toLocaleString()} m</div>
            </div>
            <div className="bg-slate-700 rounded-lg p-3 sm:p-6">
              <div className="text-slate-400 text-xs sm:text-sm mb-1">Max Distance</div>
              <div className="text-lg sm:text-3xl font-bold text-orange-400">{rocket.maxDistance.toLocaleString()} m</div>
            </div>
            <div className="bg-slate-700 rounded-lg p-3 sm:p-6">
              <div className="text-slate-400 text-xs sm:text-sm mb-1">Flight Time</div>
              <div className="text-lg sm:text-3xl font-bold text-orange-400">{rocket.flightTime.toFixed(1)} s</div>
            </div>
          </div>

          <div className="bg-slate-700 rounded-lg p-4 sm:p-8 mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">{rocket.name}</h1>
            <p className="text-slate-400 mb-4">by {rocket.designer}</p>
            {rocket.description && <p className="text-slate-300 mb-4">{rocket.description}</p>}
            <div className="text-slate-400 text-sm">👁 {rocket.views} views</div>
            {rocket.featured && <div className="text-yellow-500 text-sm mt-2">⭐ Featured Rocket</div>}
          </div>

          {/* Comments Section */}
          <div className="bg-slate-700 rounded-lg p-4 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Comments ({comments.length})</h2>

            {/* Comment Form */}
            <form onSubmit={handleCommentSubmit} className="mb-6 sm:mb-8 p-3 sm:p-6 bg-slate-600 rounded-lg">
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Your name (anonymous if blank)"
                  value={newComment.author}
                  onChange={(e) => setNewComment((prev) => ({ ...prev, author: e.target.value }))}
                  className="w-full px-4 py-2 rounded bg-slate-700 text-white border border-slate-500 focus:border-orange-500 outline-none mb-4"
                />
                <textarea
                  placeholder="Your comment..."
                  value={newComment.text}
                  onChange={(e) => setNewComment((prev) => ({ ...prev, text: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 rounded bg-slate-700 text-white border border-slate-500 focus:border-orange-500 outline-none mb-4"
                />
                <div className="flex items-center gap-4 mb-4">
                  <label className="text-slate-300">Rating:</label>
                  <select
                    value={newComment.rating}
                    onChange={(e) => setNewComment((prev) => ({ ...prev, rating: parseInt(e.target.value) }))}
                    className="px-4 py-2 rounded bg-slate-700 text-white border border-slate-500 focus:border-orange-500 outline-none"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {'⭐'.repeat(n)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={submittingComment || !newComment.text.trim()}
                className={`px-6 py-2 rounded font-semibold transition ${
                  submittingComment || !newComment.text.trim()
                    ? 'bg-slate-500 text-slate-400 cursor-not-allowed'
                    : 'bg-orange-500 hover:bg-orange-600 text-white'
                }`}
              >
                {submittingComment ? 'Posting...' : 'Post Comment'}
              </button>
            </form>

            {/* Comments List */}
            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No comments yet. Be the first!</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="bg-slate-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-white">
                          {comment.author || 'Anonymous'}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-orange-400">{'⭐'.repeat(comment.rating)}</div>
                    </div>
                    <p className="text-slate-300">{comment.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Link to="/" className="px-5 py-2.5 rounded bg-slate-600 hover:bg-slate-500 text-white font-semibold transition text-center text-sm sm:text-base">
              ← Back to Gallery
            </Link>
            <Link to="/leaderboard" className="px-5 py-2.5 rounded bg-orange-500 hover:bg-orange-600 text-white font-semibold transition text-center text-sm sm:text-base">
              View Leaderboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
