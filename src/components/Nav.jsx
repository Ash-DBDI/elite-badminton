import { useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const TABS = [
  { path: '/',         icon: '\u{1F3F8}', label: 'Session' },
  { path: '/schedule', icon: '\u{1F4CB}', label: 'Schedule' },
  { path: '/players',  icon: '\u{1F465}', label: 'Players' },
  { path: '/admin',    icon: '\u{2699}\u{FE0F}',  label: 'Admin' },
  { path: '/stats',    icon: '\u{1F3C6}', label: 'Stats' },
  { path: '/history',  icon: '\u{1F4DC}', label: 'History' },
]

export default function Nav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { theme, toggleTheme } = useApp()

  return (
    <nav style={{
      position: 'fixed', bottom: 0,
      left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: '430px',
      background: 'var(--nav)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid var(--border)',
      display: 'flex', justifyContent: 'space-around',
      padding: '8px 0 24px', zIndex: 100
    }}>
      {TABS.map(tab => {
        const active = pathname === tab.path
        return (
          <button key={tab.path} onClick={() => navigate(tab.path)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: '3px', background: 'none', border: 'none',
            cursor: 'pointer', padding: '4px 8px',
            opacity: active ? 1 : 0.4, transition: 'opacity 0.2s'
          }}>
            <span style={{ fontSize: '18px' }}>{tab.icon}</span>
            <span style={{
              fontSize: '8px', letterSpacing: '0.1em',
              textTransform: 'uppercase', color: active ? 'var(--gold)' : 'var(--text)',
              fontFamily: "'DM Sans', sans-serif", fontWeight: active ? 600 : 400
            }}>{tab.label}</span>
          </button>
        )
      })}
      <button onClick={toggleTheme} style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: '3px', background: 'none', border: 'none',
        cursor: 'pointer', padding: '4px 8px', opacity: 0.4
      }}>
        <span style={{ fontSize: '18px' }}>{theme === 'dark' ? '\u{2600}\u{FE0F}' : '\u{1F319}'}</span>
        <span style={{ fontSize: '8px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" }}>Theme</span>
      </button>
    </nav>
  )
}
