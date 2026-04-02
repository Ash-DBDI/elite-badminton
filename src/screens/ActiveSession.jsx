import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'
import Avatar from '../components/Avatar'

export default function ActiveSession() {
  const navigate = useNavigate()
  const { activeSession, loadActiveSession, players } = useApp()
  const [upcoming, setUpcoming] = useState([])
  const now = new Date()

  useEffect(() => {
    loadActiveSession()
    loadUpcoming()
  }, [])

  useEffect(() => {
    const chan = supabase.channel('session-checkin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_players' }, () => {
        loadActiveSession()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => {
        loadActiveSession()
        loadUpcoming()
      })
      .subscribe()
    return () => { supabase.removeChannel(chan) }
  }, [])

  async function loadUpcoming() {
    const { data } = await supabase
      .from('sessions')
      .select('*, session_players(count)')
      .eq('status', 'upcoming')
      .order('session_date', { ascending: true })
    setUpcoming(data || [])
  }

  async function handleCheckIn(spId, current) {
    await supabase.from('session_players').update({
      checked_in: !current,
      checked_in_at: !current ? new Date().toISOString() : null
    }).eq('id', spId)
    loadActiveSession()
  }

  const sp = activeSession?.session_players || []
  const checkedIn = sp.filter(s => s.checked_in).length

  return (
    <div className="screen" style={{ padding: '24px 16px 90px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: '28px', fontWeight: 300, color: 'var(--gold)',
          marginBottom: '4px'
        }}>Elite Badminton Social</h1>
        <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
          {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          {' \u00B7 '}
          {now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </div>
      </div>

      {!activeSession ? (
        <>
          {/* No active session */}
          <div style={{
            background: 'var(--surface)', borderRadius: '16px',
            border: '1px solid var(--border)', padding: '40px 24px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>{'\u{1F3F8}'}</div>
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '22px', fontWeight: 400, marginBottom: '8px'
            }}>No session today</div>
            <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
              Ask the admin to create a session in the Admin tab
            </div>
          </div>

          {/* Upcoming sessions */}
          {upcoming.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <div style={{
                fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em',
                color: 'var(--muted)', marginBottom: '12px', fontWeight: 600
              }}>Upcoming Sessions</div>
              {upcoming.map(s => (
                <div key={s.id} style={{
                  background: 'var(--surface)', borderRadius: '12px',
                  border: '1px solid var(--border)', padding: '14px 16px',
                  marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '14px' }}>{s.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                      {new Date(s.session_date + 'T00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      {' \u00B7 '}{s.session_time}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '11px', color: 'var(--gold)',
                    background: 'var(--gold-dim)', padding: '4px 10px',
                    borderRadius: '8px', fontWeight: 600
                  }}>Upcoming</div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Active session card */}
          <div style={{
            background: 'var(--surface)', borderRadius: '16px',
            border: '1px solid var(--border)', padding: '20px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '16px' }}>{activeSession.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                  {new Date(activeSession.session_date + 'T00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  {' \u00B7 '}{activeSession.session_time}
                  {' \u00B7 '}{activeSession.duration_minutes}min
                </div>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'var(--green-dim)', color: 'var(--green)',
                padding: '5px 12px', borderRadius: '20px',
                fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em'
              }}>
                <span style={{
                  width: '7px', height: '7px', borderRadius: '50%',
                  background: 'var(--green)', animation: 'pulse 2s infinite'
                }} />
                LIVE
              </div>
            </div>

            {/* Check-in counter */}
            <div style={{
              fontSize: '13px', color: 'var(--muted)', marginBottom: '14px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span>{checkedIn} of {sp.length} players checked in</span>
              <div style={{
                height: '4px', width: '100px', borderRadius: '4px',
                background: 'var(--surface2)', overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%', borderRadius: '4px',
                  background: 'var(--green)',
                  width: sp.length > 0 ? `${(checkedIn / sp.length) * 100}%` : '0%',
                  transition: 'width 0.3s'
                }} />
              </div>
            </div>

            {/* Player check-in list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {sp
                .sort((a, b) => (b.checked_in ? 1 : 0) - (a.checked_in ? 1 : 0))
                .map((s, i) => {
                const p = s.players
                if (!p) return null
                return (
                  <div key={s.id} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 12px', borderRadius: '10px',
                    background: s.checked_in ? 'var(--green-dim)' : 'var(--surface2)',
                    transition: 'background 0.2s',
                    cursor: 'pointer'
                  }} onClick={() => handleCheckIn(s.id, s.checked_in)}>
                    <Avatar initials={p.initials} size={32} index={i} />
                    <div style={{ flex: 1, fontWeight: 500, fontSize: '14px' }}>{p.name}</div>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '16px',
                      background: s.checked_in ? 'var(--green)' : 'transparent',
                      border: s.checked_in ? 'none' : '2px solid var(--border)',
                      color: s.checked_in ? '#fff' : 'var(--muted)',
                      transition: 'all 0.2s'
                    }}>
                      {s.checked_in ? '\u{2713}' : ''}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Go to schedule button */}
            <button onClick={() => navigate('/schedule')} style={{
              width: '100%', padding: '14px', marginTop: '16px',
              borderRadius: '12px', border: '1px solid var(--gold-border)',
              background: 'var(--gold-dim)', color: 'var(--gold)',
              fontWeight: 600, fontSize: '14px', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.02em'
            }}>
              Go to Schedule {'\u2192'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
