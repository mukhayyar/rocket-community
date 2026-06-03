import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import Gallery from './components/Gallery'
import Upload from './components/Upload'
import Leaderboard from './components/Leaderboard'
import RocketDetail from './components/RocketDetail'

function Header() {
  const location = useLocation()

  return (
    <header className="bg-slate-900 border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-white hover:text-orange-500 transition">
          🚀 RocketHub
        </Link>
        <nav className="flex gap-6">
          <Link
            to="/"
            className={`font-semibold transition ${
              location.pathname === '/' ? 'text-orange-500' : 'text-slate-300 hover:text-white'
            }`}
          >
            Gallery
          </Link>
          <Link
            to="/upload"
            className={`font-semibold transition ${
              location.pathname === '/upload' ? 'text-orange-500' : 'text-slate-300 hover:text-white'
            }`}
          >
            Upload
          </Link>
          <Link
            to="/leaderboard"
            className={`font-semibold transition ${
              location.pathname === '/leaderboard' ? 'text-orange-500' : 'text-slate-300 hover:text-white'
            }`}
          >
            Leaderboard
          </Link>
        </nav>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-700 text-slate-400 text-center py-6">
      <p>RocketHub Community — Share your rocket flights 🚀</p>
    </footer>
  )
}

export default function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-slate-900">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Gallery />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/rocket/:id" element={<RocketDetail />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  )
}
