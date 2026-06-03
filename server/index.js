import express from 'express'
import cors from 'cors'
import { v4 as uuid } from 'uuid'
import multer from 'multer'
import { db } from './db.js'

const app = express()
const upload = multer({ storage: multer.memoryStorage() })

app.use(cors())
app.use(express.json({ limit: '50mb' }))

// ===== ROCKETS API =====

// Upload new rocket
app.post('/api/rockets', upload.fields([
  { name: 'ork', maxCount: 1 },
  { name: 'csv', maxCount: 1 }
]), (req, res) => {
  const { name, designer, description, launchLat, launchLng } = req.body

  // Read CSV file
  const csvFile = req.files?.csv?.[0]
  const orkFile = req.files?.ork?.[0]

  if (!csvFile) {
    return res.status(400).json({ error: 'CSV file is required' })
  }

  const csvData = csvFile.buffer.toString('utf-8')
  const orkData = orkFile ? orkFile.buffer.toString('utf-8') : null
  
  // Parse CSV to get flight metrics
  const lines = csvData?.split('\n') || []
  let maxAlt = 0, maxDist = 0, flightTime = 0
  
  if (lines.length > 1) {
    const points = lines.slice(1).map(line => {
      const vals = line.split(',').map(v => parseFloat(v))
      return { time: vals[0], alt: vals[1], east: vals[2], north: vals[3] }
    }).filter(p => !isNaN(p.time))
    
    if (points.length > 0) {
      maxAlt = Math.max(...points.map(p => p.alt || 0))
      maxDist = Math.max(...points.map(p => Math.sqrt((p.east || 0) ** 2 + (p.north || 0) ** 2)))
      flightTime = points[points.length - 1]?.time || 0
    }
  }

  const id = uuid()
  const stmt = db.prepare(`
    INSERT INTO rockets (id, name, designer, description, orkData, csvData, launchLat, launchLng, maxAltitude, maxDistance, flightTime)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  
  stmt.run(id, name || 'Unnamed Rocket', designer, description, orkData, csvData, launchLat, launchLng, maxAlt, maxDist, flightTime)
  
  // Update leaderboards
  if (maxAlt > 0) {
    const leaderStmt = db.prepare(`INSERT INTO leaderboard (id, rocketId, category, value) VALUES (?, ?, ?, ?)`)
    leaderStmt.run(uuid(), id, 'altitude', maxAlt)
  }
  if (maxDist > 0) {
    const leaderStmt = db.prepare(`INSERT INTO leaderboard (id, rocketId, category, value) VALUES (?, ?, ?, ?)`)
    leaderStmt.run(uuid(), id, 'distance', maxDist)
  }

  res.json({ id, success: true, maxAltitude: maxAlt, maxDistance: maxDist })
})

// Get all rockets (gallery)
app.get('/api/rockets', (req, res) => {
  const { sort = 'recent', limit = 20, offset = 0 } = req.query

  let query = 'SELECT id, name, designer, maxAltitude, maxDistance, flightTime, views, featured FROM rockets'

  if (sort === 'recent') query += ' ORDER BY uploadedAt DESC'
  else if (sort === 'trending') query += ' ORDER BY views DESC'
  else if (sort === 'altitude') query += ' ORDER BY maxAltitude DESC'
  else if (sort === 'distance') query += ' ORDER BY maxDistance DESC'

  query += ` LIMIT ${limit} OFFSET ${offset}`

  const rockets = db.prepare(query).all()
  const total = db.prepare('SELECT COUNT(*) as count FROM rockets').get().count

  res.json(rockets)
})

// Get single rocket
app.get('/api/rockets/:id', (req, res) => {
  const { id } = req.params
  const rocket = db.prepare('SELECT * FROM rockets WHERE id = ?').get(id)
  
  if (!rocket) return res.status(404).json({ error: 'Rocket not found' })
  
  // Increment views
  db.prepare('UPDATE rockets SET views = views + 1 WHERE id = ?').run(id)
  
  const comments = db.prepare('SELECT id, author, text, rating, createdAt FROM comments WHERE rocketId = ? ORDER BY createdAt DESC LIMIT 50').all(id)
  
  res.json({ ...rocket, comments })
})

// ===== LEADERBOARDS =====

app.get('/api/leaderboards/:category', (req, res) => {
  const { category } = req.params
  const limit = req.query.limit || 50

  const leaderboard = db.prepare(`
    SELECT r.id as rocketId, r.name as rocketName, r.designer, l.value
    FROM leaderboard l
    JOIN rockets r ON l.rocketId = r.id
    WHERE l.category = ?
    ORDER BY l.value DESC
    LIMIT ?
  `).all(category, parseInt(limit))

  res.json(leaderboard)
})

// ===== COMMENTS =====

app.post('/api/rockets/:id/comments', (req, res) => {
  const { id } = req.params
  const { author = 'Anonymous', text, rating = 5 } = req.body

  if (!text) return res.status(400).json({ error: 'Comment text required' })

  const commentId = uuid()
  db.prepare(`
    INSERT INTO comments (id, rocketId, author, text, rating)
    VALUES (?, ?, ?, ?, ?)
  `).run(commentId, id, author, text, rating)

  const comment = db.prepare('SELECT id, author, text, rating, createdAt FROM comments WHERE id = ?').get(commentId)
  res.json(comment)
})

// ===== SEARCH =====

app.get('/api/search', (req, res) => {
  const { q } = req.query
  if (!q) return res.json({ results: [] })
  
  const results = db.prepare(`
    SELECT id, name, designer, maxAltitude, maxDistance FROM rockets
    WHERE name LIKE ? OR designer LIKE ?
    LIMIT 20
  `).all(`%${q}%`, `%${q}%`)
  
  res.json({ results })
})

// ===== STATS =====

app.get('/api/stats', (req, res) => {
  const totalRockets = db.prepare('SELECT COUNT(*) as count FROM rockets').get().count
  const totalComments = db.prepare('SELECT COUNT(*) as count FROM comments').get().count
  const avgAltitude = db.prepare('SELECT AVG(maxAltitude) as avg FROM rockets').get().avg || 0
  const recordAltitude = db.prepare('SELECT MAX(maxAltitude) as max FROM rockets').get().max || 0
  
  res.json({
    totalRockets,
    totalComments,
    avgAltitude: avgAltitude.toFixed(0),
    recordAltitude: recordAltitude.toFixed(0),
  })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`🚀 Rocket Community API running on http://localhost:${PORT}`)
  console.log(`   - POST   /api/rockets          - Upload rocket`)
  console.log(`   - GET    /api/rockets          - Gallery`)
  console.log(`   - GET    /api/rockets/:id      - Rocket details`)
  console.log(`   - GET    /api/leaderboards/:cat - Leaderboard`)
  console.log(`   - GET    /api/stats            - Community stats`)
  console.log(`   - GET    /api/search           - Search rockets`)
})
