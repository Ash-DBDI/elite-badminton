import { useNavigate, useLocation } from 'react-router-dom'

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

  return (
    <nav style={{
      position: 'fixed', bottom: 0,
      left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: '430px',
      background: 'var(--nav)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid var(--border)',
      display: 'flex', justifyContent: 'space-around',
      padding: '6px 0 24px', zIndex: 100
    }}>
      {TABS.map(tab => {
        const active = pathname === tab.path || (tab.path === '/players' && pathname.startsWith('/players/'))
        return (
          <button key={tab.path} onClick={() => navigate(tab.path)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: '2px', background: 'none', border: 'none',
            cursor: 'pointer', padding: '4px 8px', position: 'relative',
            opacity: active ? 1 : 0.4, transition: 'opacity 0.2s'
          }}>
            {active && <div style={{
              position: 'absolute', top: '-6px', left: '50%', transform: 'translateX(-50%)',
              width: '16px', height: '2px', borderRadius: '1px', background: 'var(--gold)'
            }} />}
            <span style={{ fontSize: '18px' }}>{tab.icon}</span>
            <span style={{
              fontSize: '8px', letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: active ? 'var(--gold)' : 'var(--text)',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: active ? 600 : 400
            }}>{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
