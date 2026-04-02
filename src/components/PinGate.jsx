import { useState } from 'react'
import { useApp } from '../context/AppContext'

export default function PinGate({ children, fallback }) {
  const { isAdmin, loginAdmin } = useApp()
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  if (isAdmin) return children

  if (fallback) return fallback

  function handleSubmit() {
    if (!loginAdmin(pin)) setError(true)
    else setPin('')
  }

  return (
    <div style={{ padding: '60px 32px', textAlign: 'center' }}>
      <div style={{ fontSize: '32px', marginBottom: '16px' }}>{'\u{1F510}'}</div>
      <div style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: '26px', fontWeight: 300, marginBottom: '8px'
      }}>Admin Access</div>
      <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '32px' }}>
        Enter your PIN to manage sessions
      </div>
      <input
        type="password" value={pin}
        onChange={e => { setPin(e.target.value); setError(false) }}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        placeholder="Enter PIN" maxLength={6}
        style={{
          width: '140px', padding: '14px', textAlign: 'center',
          borderRadius: '12px', border: `1px solid ${error ? 'var(--red)' : 'var(--border)'}`,
          background: 'var(--surface2)', color: 'var(--text)',
          fontSize: '20px', letterSpacing: '0.25em',
          fontFamily: "'DM Sans', sans-serif", outline: 'none',
          display: 'block', margin: '0 auto 12px'
        }}
      />
      {error && <div style={{ color: 'var(--red)', fontSize: '12px', marginBottom: '12px' }}>Incorrect PIN</div>}
      <button onClick={handleSubmit} style={{
        padding: '12px 32px', borderRadius: '12px',
        background: 'var(--gold)', border: 'none',
        color: '#111', fontWeight: 600, fontSize: '13px',
        cursor: 'pointer', letterSpacing: '0.06em'
      }}>Unlock</button>
    </div>
  )
}
