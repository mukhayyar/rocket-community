// API configuration - supports both absolute URLs and relative paths
const getApiBase = () => {
  // In development: use localhost:3000
  // In production: use relative path /api or environment variable
  if (import.meta.env.DEV) {
    return 'http://localhost:3000'
  }
  return import.meta.env.VITE_API_URL || '/api'
}

const API_BASE = getApiBase()

export const api = {
  rockets: {
    list: (sort: string = 'recent', limit: number = 20, offset: number = 0) =>
      `${API_BASE}/api/rockets?sort=${sort}&limit=${limit}&offset=${offset}`,
    get: (id: string) => `${API_BASE}/api/rockets/${id}`,
    upload: () => `${API_BASE}/api/rockets`,
    comment: (id: string) => `${API_BASE}/api/rockets/${id}/comments`,
  },
  leaderboards: {
    get: (category: string, limit: number = 50) =>
      `${API_BASE}/api/leaderboards/${category}?limit=${limit}`,
  },
  search: (q: string) => `${API_BASE}/api/search?q=${encodeURIComponent(q)}`,
  stats: () => `${API_BASE}/api/stats`,
}
