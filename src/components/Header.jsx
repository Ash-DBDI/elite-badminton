import EBSLogo from './EBSLogo'
import { useApp } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'

export default function Header({ title, showBack }) {
  const { theme, toggleTheme } = useApp()
  const navigate = useNavigate()

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'var(--bg)',
      borderBottom: '1px solid var(--gold-border)',
      padding: '48px 20px 14px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      boxShadow: '0 2px 20px rgba(0,0,0,0.3)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {showBack ? (
          <button onClick={() => navigate(-1)} style={{
            background: 'none', border: 'none', color: 'var(--gold)',
            fontSize: '20px', cursor: 'pointer', padding: '0 8px 0 0'
          }}>{'\u2190'}</button>
        ) : (
          <EBSLogo size={38} />
        )}
        <div>
          <div style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: showBack ? '20px' : '22px',
            fontWeight: 700,
            letterSpacing: showBack ? '0.02em' : '0.15em',
            textTransform: showBack ? 'none' : 'uppercase',
            color: 'var(--gold)', lineHeight: 1
          }}>
            {showBack ? title : 'EBS'}
          </div>
          {!showBack && (
            <div style={{
              fontSize: '8px', letterSpacing: '0.12em',
              textTransform: 'uppercase', color: 'var(--muted)', marginTop: '3px'
            }}>Elite Badminton Social {'\u00B7'} Private Group</div>
          )}
        </div>
      </div>
      <button onClick={toggleTheme} style={{
        background: 'var(--gold-dim)', border: '1px solid var(--gold-border)',
        borderRadius: '20px', padding: '6px 12px', cursor: 'pointer',
        fontSize: '14px', color: 'var(--text)'
      }}>
        {theme === 'dark' ? '\u{2600}\u{FE0F}' : '\u{1F319}'}
      </button>
    </div>
  )
}
