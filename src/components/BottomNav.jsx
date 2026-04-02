import { useLocation, useNavigate } from 'react-router-dom'
import { useSession } from '../context/SessionContext'

const navItems = [
  { path: '/', label: 'Home', icon: '\u{1F3E0}' },
  { path: '/session', label: 'Session', icon: '\u{1F3F8}' },
  { path: '/leaderboard', label: 'Board', icon: '\u{1F3C6}' },
  { path: '/players', label: 'Players', icon: '\u{1F465}' },
  { path: '/history', label: 'History', icon: '\u{1F4CB}' },
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const { activeSession } = useSession()

  const getSessionPath = () => {
    if (!activeSession) return '/session'
    if (activeSession.status === 'setup') return '/session'
    return '/live'
  }

  return (
    <nav className="bottom-nav">
      {navItems.map(item => {
        const path = item.path === '/session' ? getSessionPath() : item.path
        const isActive = location.pathname === path ||
          (item.path === '/session' && ['/session', '/live', '/session-end'].includes(location.pathname))
        return (
          <button
            key={item.path}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => navigate(path)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
