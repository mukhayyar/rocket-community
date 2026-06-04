import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'

export default function Upload() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    designer: '',
    description: '',
    launchLat: '',
    launchLng: '',
  })
  const [files, setFiles] = useState<{ ork?: File; csv?: File }>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (type: 'ork' | 'csv') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFiles((prev) => ({ ...prev, [type]: file }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!files.csv) {
        setError('CSV file is required')
        setLoading(false)
        return
      }

      const form = new FormData()
      form.append('name', formData.name)
      form.append('designer', formData.designer)
      form.append('description', formData.description)
      form.append('launchLat', formData.launchLat || '0')
      form.append('launchLng', formData.launchLng || '0')
      if (files.ork) form.append('ork', files.ork)
      form.append('csv', files.csv)

      const response = await fetch(api.rockets.upload(), {
        method: 'POST',
        body: form,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      navigate(`/rocket/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 px-4 py-6 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl sm:text-4xl font-bold text-white mb-1 sm:mb-2">Upload Your Rocket</h1>
        <p className="text-slate-300 text-sm sm:text-base mb-6 sm:mb-8">Share your rocket flight with the community</p>

        <form onSubmit={handleSubmit} className="bg-slate-700 rounded-lg p-4 sm:p-8 space-y-5 sm:space-y-6">
          {error && <div className="bg-red-500 text-white px-4 py-3 rounded">{error}</div>}

          <div>
            <label className="block text-white font-semibold mb-2">Rocket Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 rounded bg-slate-600 text-white border border-slate-500 focus:border-orange-500 outline-none"
              placeholder="e.g., My Super Rocket"
            />
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">Your Name</label>
            <input
              type="text"
              name="designer"
              value={formData.designer}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 rounded bg-slate-600 text-white border border-slate-500 focus:border-orange-500 outline-none"
              placeholder="Your name or team"
            />
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">Description (Optional)</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded bg-slate-600 text-white border border-slate-500 focus:border-orange-500 outline-none h-24"
              placeholder="Tell us about your rocket..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-white font-semibold mb-2">Launch Latitude</label>
              <input
                type="number"
                name="launchLat"
                value={formData.launchLat}
                onChange={handleInputChange}
                step="0.0001"
                className="w-full px-4 py-2 rounded bg-slate-600 text-white border border-slate-500 focus:border-orange-500 outline-none"
                placeholder="e.g., -6.2088"
              />
            </div>
            <div>
              <label className="block text-white font-semibold mb-2">Launch Longitude</label>
              <input
                type="number"
                name="launchLng"
                value={formData.launchLng}
                onChange={handleInputChange}
                step="0.0001"
                className="w-full px-4 py-2 rounded bg-slate-600 text-white border border-slate-500 focus:border-orange-500 outline-none"
                placeholder="e.g., 106.8456"
              />
            </div>
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">ORK File (Optional)</label>
            <input
              type="file"
              accept=".ork"
              onChange={handleFileChange('ork')}
              className="w-full px-4 py-2 rounded bg-slate-600 text-slate-300 border border-slate-500"
            />
            {files.ork && <p className="text-sm text-green-400 mt-1">✓ {files.ork.name}</p>}
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">Flight Data (CSV) *</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange('csv')}
              required
              className="w-full px-4 py-2 rounded bg-slate-600 text-slate-300 border border-slate-500"
            />
            {files.csv && <p className="text-sm text-green-400 mt-1">✓ {files.csv.name}</p>}
            <p className="text-xs text-slate-400 mt-2">CSV format: time, altitude, xPos, yPos, rollRate, pitchRate, yawRate</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold transition ${
              loading
                ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                : 'bg-orange-500 hover:bg-orange-600 text-white'
            }`}
          >
            {loading ? 'Uploading...' : 'Upload Rocket'}
          </button>
        </form>
      </div>
    </div>
  )
}
