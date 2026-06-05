import express from 'express'
import cors from 'cors'
import { v4 as uuid } from 'uuid'
import multer from 'multer'
import XLSX from 'xlsx'
import { db } from './db.js'

const app = express()
const upload = multer({ storage: multer.memoryStorage() })

app.use(cors())
app.use(express.json({ limit: '50mb' }))

// ===== XLSX/CSV PARSER =====

// Column name mapping for OpenRocket XLSX "All Variables" sheet
const COLUMN_MAP = {
  'Time (s)': 'time',
  'Altitude (m)': 'altitude',
  'Position East of launch (m)': 'east',
  'Position North of launch (m)': 'north',
  'Latitude (° N)': 'lat',
  'Longitude (° E)': 'lng',
  'Roll rate (°/s)': 'rollRate',
  'Pitch rate (°/s)': 'pitchRate',
  'Yaw rate (°/s)': 'yawRate',
  'Vertical velocity (m/s)': 'verticalVelocity',
  'Total velocity (m/s)': 'totalVelocity',
  'Vertical acceleration (m/s²)': 'verticalAccel',
  'Total acceleration (m/s²)': 'totalAccel',
  'Thrust (N)': 'thrust',
  'Drag force (N)': 'drag',
  'Mass (g)': 'mass',
  'Mach number (\u200b)': 'mach',
  'Stability margin calibers (\u200b)': 'stabilityMargin',
  'Angle of attack (°)': 'aoa',
  'CP location (cm)': 'cpLocation',
  'CG location (cm)': 'cgLocation',
}

function parseXLSX(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' })

  // Prefer "All Variables" sheet, fall back to "Flight Data"
  const sheetName = workbook.SheetNames.find(n => n.includes('All Variables'))
    || workbook.SheetNames.find(n => n.includes('Flight Data'))
    || workbook.SheetNames[0]

  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null })

  // Find header row (row with "Time (s)")
  let headerIdx = -1
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    if (rows[i]?.some(cell => cell === 'Time (s)')) {
      headerIdx = i
      break
    }
  }
  if (headerIdx === -1) throw new Error('Could not find header row with "Time (s)" in XLSX')

  const headers = rows[headerIdx]
  const colIndices = {}
  headers.forEach((h, i) => {
    const mapped = COLUMN_MAP[h]
    if (mapped) colIndices[mapped] = i
  })

  if (colIndices.time === undefined || colIndices.altitude === undefined) {
    throw new Error('XLSX missing required columns: Time (s), Altitude (m)')
  }

  const points = []
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.length === 0) continue

    const time = parseFloat(row[colIndices.time])
    if (isNaN(time) || !isFinite(time)) continue

    const point = {
      time,
      altitude: parseFloat(row[colIndices.altitude]) || 0,
      east: colIndices.east !== undefined ? (parseFloat(row[colIndices.east]) || 0) : 0,
      north: colIndices.north !== undefined ? (parseFloat(row[colIndices.north]) || 0) : 0,
      lat: colIndices.lat !== undefined ? (parseFloat(row[colIndices.lat]) || 0) : 0,
      lng: colIndices.lng !== undefined ? (parseFloat(row[colIndices.lng]) || 0) : 0,
      rollRate: colIndices.rollRate !== undefined ? (parseFloat(row[colIndices.rollRate]) || 0) : 0,
      pitchRate: colIndices.pitchRate !== undefined ? (parseFloat(row[colIndices.pitchRate]) || 0) : 0,
      yawRate: colIndices.yawRate !== undefined ? (parseFloat(row[colIndices.yawRate]) || 0) : 0,
      totalVelocity: colIndices.totalVelocity !== undefined ? (parseFloat(row[colIndices.totalVelocity]) || 0) : 0,
      thrust: colIndices.thrust !== undefined ? (parseFloat(row[colIndices.thrust]) || 0) : 0,
      drag: colIndices.drag !== undefined ? (parseFloat(row[colIndices.drag]) || 0) : 0,
      mass: colIndices.mass !== undefined ? (parseFloat(row[colIndices.mass]) || 0) : 0,
      mach: colIndices.mach !== undefined ? (parseFloat(row[colIndices.mach]) || 0) : 0,
      aoa: colIndices.aoa !== undefined ? (parseFloat(row[colIndices.aoa]) || 0) : 0,
    }
    points.push(point)
  }

  return points
}

function parseCSV(csvText) {
  const lines = csvText.split('\n').filter(l => l.trim())
  if (lines.length < 2) throw new Error('CSV must have at least 2 data rows')

  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => parseFloat(v))
    return {
      time: vals[0], altitude: vals[1],
      east: vals[2] || 0, north: vals[3] || 0,
      rollRate: vals[4] || 0, pitchRate: vals[5] || 0, yawRate: vals[6] || 0,
    }
  }).filter(p => !isNaN(p.time) && isFinite(p.time))
}

function pointsToCSV(points) {
  const header = 'time,altitude,east,north,rollRate,pitchRate,yawRate,totalVelocity,thrust,drag,mass,mach,aoa'
  const rows = points.map(p =>
    [p.time, p.altitude, p.east, p.north, p.rollRate || 0, p.pitchRate || 0, p.yawRate || 0,
     p.totalVelocity || 0, p.thrust || 0, p.drag || 0, p.mass || 0, p.mach || 0, p.aoa || 0].join(',')
  )
  return [header, ...rows].join('\n')
}

// ===== ROCKETS API =====

// Upload new rocket
app.post('/api/rockets', upload.fields([
  { name: 'ork', maxCount: 1 },
  { name: 'csv', maxCount: 1 },
  { name: 'flightdata', maxCount: 1 },
]), (req, res) => {
  const { name, designer, description, launchLat, launchLng } = req.body

  const flightFile = req.files?.flightdata?.[0] || req.files?.csv?.[0]
  const orkFile = req.files?.ork?.[0]

  if (!flightFile) {
    return res.status(400).json({ error: 'Flight data file required (CSV or XLSX)' })
  }

  if (flightFile.size > 10 * 1024 * 1024) {
    return res.status(400).json({ error: 'Flight data file too large (max 10MB)' })
  }
  if (orkFile && orkFile.size > 10 * 1024 * 1024) {
    return res.status(400).json({ error: 'ORK file too large (max 10MB)' })
  }

  const orkData = orkFile ? orkFile.buffer.toString('utf-8') : null

  // Detect file type and parse
  let points
  const fileName = flightFile.originalname?.toLowerCase() || ''
  const isXLSX = fileName.endsWith('.xlsx') || fileName.endsWith('.xls')
    || flightFile.mimetype?.includes('spreadsheet') || flightFile.mimetype?.includes('excel')

  try {
    if (isXLSX) {
      points = parseXLSX(flightFile.buffer)
    } else {
      points = parseCSV(flightFile.buffer.toString('utf-8'))
    }
  } catch (err) {
    return res.status(400).json({ error: `Failed to parse flight data: ${err.message}` })
  }

  if (points.length === 0) {
    return res.status(400).json({ error: 'Flight data contains no valid data rows' })
  }

  // Convert to standard CSV for storage
  const csvData = pointsToCSV(points)

  // Extract metrics
  const maxAlt = Math.max(...points.map(p => p.altitude || 0))
  const maxDist = Math.max(...points.map(p => Math.sqrt((p.east || 0) ** 2 + (p.north || 0) ** 2)))
  const flightTime = points[points.length - 1]?.time || 0

  // Auto-detect launch coordinates from data if not provided
  const detectedLat = points[0]?.lat || parseFloat(launchLat) || 0
  const detectedLng = points[0]?.lng || parseFloat(launchLng) || 0

  const id = uuid()
  db.prepare(`
    INSERT INTO rockets (id, name, designer, description, orkData, csvData, launchLat, launchLng, maxAltitude, maxDistance, flightTime)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name || 'Unnamed Rocket', designer, description, orkData, csvData, detectedLat, detectedLng, maxAlt, maxDist, flightTime)

  res.json({ id, success: true, maxAltitude: maxAlt, maxDistance: maxDist, flightTime, dataPoints: points.length })
})

// Get all rockets (gallery)
app.get('/api/rockets', (req, res) => {
  const sort = req.query.sort || 'recent'
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100)
  const offset = Math.max(parseInt(req.query.offset) || 0, 0)

  const sortColumns = {
    recent: 'uploadedAt DESC',
    trending: 'views DESC',
    altitude: 'maxAltitude DESC',
    distance: 'maxDistance DESC',
  }
  const orderBy = sortColumns[sort] || 'uploadedAt DESC'

  const rockets = db.prepare(
    `SELECT id, name, designer, maxAltitude, maxDistance, flightTime, views, featured FROM rockets ORDER BY ${orderBy} LIMIT ? OFFSET ?`
  ).all(limit, offset)

  res.json(rockets)
})

// Get single rocket (metadata only)
app.get('/api/rockets/:id', (req, res) => {
  const { id } = req.params
  const rocket = db.prepare(
    'SELECT id, name, designer, description, launchLat, launchLng, maxAltitude, maxDistance, flightTime, uploadedAt, views, featured FROM rockets WHERE id = ?'
  ).get(id)

  if (!rocket) return res.status(404).json({ error: 'Rocket not found' })

  db.prepare('UPDATE rockets SET views = views + 1 WHERE id = ?').run(id)

  const comments = db.prepare('SELECT id, author, text, rating, createdAt FROM comments WHERE rocketId = ? ORDER BY createdAt DESC LIMIT 50').all(id)

  res.json({ ...rocket, comments })
})

// Get flight data (heavy payload)
app.get('/api/rockets/:id/data', (req, res) => {
  const { id } = req.params
  const rocket = db.prepare('SELECT csvData, orkData, launchLat, launchLng FROM rockets WHERE id = ?').get(id)

  if (!rocket) return res.status(404).json({ error: 'Rocket not found' })

  res.json(rocket)
})

// ===== LEADERBOARDS =====

app.get('/api/leaderboards/:category', (req, res) => {
  const { category } = req.params
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 100)

  const columnMap = { altitude: 'maxAltitude', distance: 'maxDistance', duration: 'flightTime' }
  const col = columnMap[category]
  if (!col) return res.status(400).json({ error: 'Invalid category. Use: altitude, distance, duration' })

  const leaderboard = db.prepare(
    `SELECT id as rocketId, name as rocketName, designer, ${col} as value FROM rockets WHERE ${col} > 0 ORDER BY ${col} DESC LIMIT ?`
  ).all(limit)

  res.json(leaderboard)
})

// ===== COMMENTS =====

app.post('/api/rockets/:id/comments', (req, res) => {
  const { id } = req.params
  const { author = 'Anonymous', text, rating = 5 } = req.body

  if (!text) return res.status(400).json({ error: 'Comment text required' })

  const commentId = uuid()
  db.prepare(`INSERT INTO comments (id, rocketId, author, text, rating) VALUES (?, ?, ?, ?, ?)`).run(commentId, id, author, text, rating)

  const comment = db.prepare('SELECT id, author, text, rating, createdAt FROM comments WHERE id = ?').get(commentId)
  res.json(comment)
})

// ===== SEARCH =====

app.get('/api/search', (req, res) => {
  const { q } = req.query
  if (!q) return res.json({ results: [] })

  const results = db.prepare(
    `SELECT id, name, designer, maxAltitude, maxDistance FROM rockets WHERE name LIKE ? OR designer LIKE ? LIMIT 20`
  ).all(`%${q}%`, `%${q}%`)

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
  console.log(`Rocket Community API running on http://localhost:${PORT}`)
  console.log(`  Accepts: CSV, XLSX (OpenRocket export)`)
})
