import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'
// Schedule is generated from ActiveSession screen after players check in
import Avatar from '../components/Avatar'
import PinGate from '../components/PinGate'
import Header from '../components/Header'

const HOURS = []
for (let h = 6; h <= 22; h++) HOURS.push(h)
const MINUTES = ['00', '15', '30', '45']

export default function Admin() {
  const navigate = useNavigate()
  const { players, activeSession, loadActiveSession, loadPlayers } = useApp()

  const [title, setTitle] = useState('Badminton Session')
  const [selectedDate, setSelectedDate] = useState(null)
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [hour, setHour] = useState(18)
  const [minute, setMinute] = useState('00')
  const [duration, setDuration] = useState(120)
  const [selectedPlayers, setSelectedPlayers] = useState({})
  const [notes, setNotes] = useState('')
  const [upcoming, setUpcoming] = useState([])
  const [creating, setCreating] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [showDeleteSession, setShowDeleteSession] = useState(false)

  useEffect(() => {
    const sel = {}
    players.forEach(p => { sel[p.id] = true })
    setSelectedPlayers(sel)
  }, [players])

  useEffect(() => {
    loadUpcoming()
  }, [])

  async function loadUpcoming() {
    const { data } = await supabase.from('sessions')
      .select('*, session_players(count)')
      .eq('status', 'upcoming')
      .order('session_date', { ascending: true })
    setUpcoming(data || [])
  }

  function togglePlayer(id) {
    setSelectedPlayers(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const selectedCount = Object.values(selectedPlayers).filter(Boolean).length
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Calendar logic
  const firstDay = new Date(calYear, calMonth, 1).getDay()
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
  const calDays = []
  for (let i = 0; i < firstDay; i++) calDays.push(null)
  for (let d = 1; d <= daysInMonth; d++) calDays.push(d)

  function formatTime(h, m) {
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hh = h > 12 ? h - 12 : h === 0 ? 12 : h
    return `${hh}:${m} ${ampm}`
  }

  async function handleCreate() {
    if (!selectedDate) return alert('Select a date')
    if (selectedCount < 4) return alert('Need at least 4 players')
    setCreating(true)
    try {
      const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`
      const timeStr = formatTime(hour, minute)

      // 1. Insert session
      const { data: session, error } = await supabase.from('sessions').insert({
        title, session_date: dateStr, session_time: timeStr,
        duration_minutes: duration, status: 'active', notes: notes || null
      }).select().single()
      if (error) throw error

      // 2. Insert session_players (no one checked in yet)
      const selIds = Object.entries(selectedPlayers).filter(([, v]) => v).map(([k]) => k)
      const spRows = selIds.map(pid => ({ session_id: session.id, player_id: pid, checked_in: false }))
      await supabase.from('session_players').insert(spRows)

      // Schedule will be generated from ActiveSession screen once players check in
      await loadActiveSession()
      navigate('/')
    } catch (err) {
      console.error(err)
      alert('Error creating session: ' + err.message)
    } finally {
      setCreating(false)
    }
  }

  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [ending, setEnding] = useState(false)

  async function handleEndSession() {
    if (!activeSession) return
    setEnding(true)
    try {
      const allGames = activeSession.games || []
      const completedGames = allGames.filter(g => g.status === 'completed')
      const spList = activeSession.session_players || []
      const newBadges = []

      // Calculate POTD
      let bestScore = -999, potdId = null
      spList.forEach(sp => {
        const score = sp.games_won * 3 + (sp.points_scored - sp.points_conceded) * 0.1
        if (score > bestScore && sp.games_played > 0) { bestScore = score; potdId = sp.player_id }
      })
      if (potdId) {
        await supabase.from('badges').insert({ player_id: potdId, session_id: activeSession.id, badge_type: 'POTD' })
        newBadges.push({ player_id: potdId, badge_type: 'POTD' })
      }

      // Iron Man
      const totalGames = completedGames.length
      if (totalGames >= 3) {
        for (const sp of spList) {
          if (sp.games_played >= totalGames) {
            await supabase.from('badges').insert({ player_id: sp.player_id, session_id: activeSession.id, badge_type: 'IRON_MAN' })
            newBadges.push({ player_id: sp.player_id, badge_type: 'IRON_MAN' })
          }
        }
      }

      // The Wall
      const activeSp = spList.filter(s => s.games_played > 0)
      if (activeSp.length > 0) {
        const minConceded = Math.min(...activeSp.map(s => s.points_conceded))
        for (const sp of activeSp.filter(s => s.points_conceded === minConceded)) {
          await supabase.from('badges').insert({ player_id: sp.player_id, session_id: activeSession.id, badge_type: 'THE_WALL' })
          newBadges.push({ player_id: sp.player_id, badge_type: 'THE_WALL' })
        }
      }

      // Delete pending/active games
      await supabase.from('games').delete().eq('session_id', activeSession.id).in('status', ['pending', 'active'])

      // Complete session
      await supabase.from('sessions').update({
        status: 'completed', player_of_day: potdId, completed_at: new Date().toISOString()
      }).eq('id', activeSession.id)

      const potdPlayer = potdId ? players.find(p => p.id === potdId) : null
      const sessionDate = new Date(activeSession.session_date + 'T00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

      await loadActiveSession()
      await loadPlayers()
      setShowEndConfirm(false)

      navigate('/session-end', { state: {
        sessionId: activeSession.id, potdPlayer, newBadges,
        sessionStats: spList, games: completedGames, sessionDate
      }})
    } catch (err) {
      console.error(err)
      alert('Error ending session')
    } finally { setEnding(false) }
  }

  async function handleDeleteUpcoming(id) {
    if (!confirm('Delete this upcoming session?')) return
    await supabase.from('sessions').delete().eq('id', id)
    loadUpcoming()
  }

  const sInput = {
    width: '100%', padding: '12px', borderRadius: '10px',
    border: '1px solid var(--border)', background: 'var(--surface2)',
    color: 'var(--text)', fontSize: '14px', outline: 'none',
    fontFamily: "'DM Sans', sans-serif", marginBottom: '14px'
  }

  const sSelect = {
    padding: '10px 12px', borderRadius: '10px',
    border: '1px solid var(--border)', background: 'var(--surface2)',
    color: 'var(--text)', fontSize: '13px', outline: 'none',
    fontFamily: "'DM Sans', sans-serif", flex: 1
  }

  return (
    <PinGate>
      <div className="screen" style={{ padding: '20px 16px 90px' }}>
        <Header />
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px', fontWeight: 300, marginBottom: '24px' }}>
          Admin
        </div>

        {/* Create session */}
        <div style={{
          background: 'var(--surface)', borderRadius: '16px',
          border: '1px solid var(--border)', padding: '20px', marginBottom: '16px'
        }}>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>Create New Session</div>

          {/* Title */}
          <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px', fontWeight: 600 }}>Session Title</div>
          <input value={title} onChange={e => setTitle(e.target.value)} style={sInput} />

          {/* Calendar */}
          <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', fontWeight: 600 }}>Date</div>
          <div style={{
            background: 'var(--surface2)', borderRadius: '12px',
            padding: '14px', marginBottom: '14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1) } else setCalMonth(calMonth - 1) }}
                style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: '16px', cursor: 'pointer', padding: '4px 8px' }}>{'\u25C0'}</button>
              <span style={{ fontWeight: 600, fontSize: '14px' }}>
                {new Date(calYear, calMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1) } else setCalMonth(calMonth + 1) }}
                style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: '16px', cursor: 'pointer', padding: '4px 8px' }}>{'\u25B6'}</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center' }}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                <div key={d} style={{ fontSize: '9px', color: 'var(--muted)', padding: '4px', fontWeight: 600 }}>{d}</div>
              ))}
              {calDays.map((day, idx) => {
                if (!day) return <div key={`e${idx}`} />
                const date = new Date(calYear, calMonth, day)
                date.setHours(0, 0, 0, 0)
                const isPast = date < today
                const isToday = date.getTime() === today.getTime()
                const isSelected = selectedDate === day && calMonth === new Date(calYear, calMonth).getMonth()
                return (
                  <button key={idx} disabled={isPast}
                    onClick={() => setSelectedDate(day)}
                    style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto', fontSize: '12px', fontWeight: isSelected ? 700 : 400,
                      background: isSelected ? 'var(--gold)' : 'transparent',
                      color: isSelected ? '#111' : isPast ? 'var(--muted)' : 'var(--text)',
                      border: isToday && !isSelected ? '1px solid var(--gold-border)' : 'none',
                      cursor: isPast ? 'default' : 'pointer',
                      opacity: isPast ? 0.3 : 1,
                      fontFamily: "'DM Sans', sans-serif"
                    }}>
                    {day}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Time */}
          <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px', fontWeight: 600 }}>Time</div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <select value={hour} onChange={e => setHour(Number(e.target.value))} style={sSelect}>
              {HOURS.map(h => <option key={h} value={h}>{h > 12 ? h - 12 : h === 0 ? 12 : h} {h >= 12 ? 'PM' : 'AM'}</option>)}
            </select>
            <select value={minute} onChange={e => setMinute(e.target.value)} style={sSelect}>
              {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* Duration */}
          <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', fontWeight: 600 }}>Duration</div>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
            {[60, 90, 120, 150, 180].map(d => (
              <button key={d} onClick={() => setDuration(d)} style={{
                padding: '8px 14px', borderRadius: '8px',
                background: duration === d ? 'var(--gold)' : 'var(--surface2)',
                color: duration === d ? '#111' : 'var(--text)',
                border: '1px solid var(--border)', fontSize: '12px',
                fontWeight: duration === d ? 700 : 400, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif"
              }}>
                {d}m
              </button>
            ))}
          </div>

          {/* Player selection */}
          <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', fontWeight: 600 }}>
            Players ({selectedCount} selected)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '14px' }}>
            {players.map((p, i) => (
              <div key={p.id} onClick={() => togglePlayer(p.id)} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '8px',
                background: selectedPlayers[p.id] ? 'var(--gold-dim)' : 'var(--surface2)',
                cursor: 'pointer', transition: 'background 0.15s'
              }}>
                <div style={{
                  width: '20px', height: '20px', borderRadius: '4px',
                  border: `2px solid ${selectedPlayers[p.id] ? 'var(--gold)' : 'var(--border)'}`,
                  background: selectedPlayers[p.id] ? 'var(--gold)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#111', fontSize: '12px', fontWeight: 800
                }}>
                  {selectedPlayers[p.id] ? '\u{2713}' : ''}
                </div>
                <Avatar initials={p.initials} size={28} index={i} avatarId={p.avatar_id} />
                <span style={{ fontSize: '13px', fontWeight: 500 }}>{p.name}</span>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px', fontWeight: 600 }}>Notes (optional)</div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Any notes for this session..."
            style={{ ...sInput, minHeight: '60px', resize: 'vertical' }} />

          {/* Create button */}
          <button onClick={handleCreate} disabled={creating} style={{
            width: '100%', padding: '16px', borderRadius: '12px',
            background: creating ? 'var(--surface2)' : 'var(--gold)',
            border: 'none', color: '#111', fontWeight: 700, fontSize: '15px',
            cursor: creating ? 'wait' : 'pointer', fontFamily: "'DM Sans', sans-serif",
            letterSpacing: '0.02em'
          }}>
            {creating ? 'Creating...' : 'Create Session'}
          </button>
        </div>

        {/* Active session management */}
        {activeSession && (
          <div style={{
            background: 'var(--surface)', borderRadius: '16px',
            border: '1px solid var(--border)', padding: '20px', marginBottom: '16px'
          }}>
            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Active Session</div>
            <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '14px' }}>
              {activeSession.title} {'\u00B7'} {new Date(activeSession.session_date + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
            {!showEndConfirm ? (
              <button onClick={() => setShowEndConfirm(true)} style={{
                width: '100%', padding: '14px', borderRadius: '12px',
                background: 'var(--red-dim)', border: '1px solid var(--red)',
                color: 'var(--red)', fontWeight: 600, fontSize: '14px',
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", marginBottom: '10px'
              }}>End Session</button>
            ) : (
              <div style={{ background: 'var(--surface2)', borderRadius: '12px', padding: '16px', marginBottom: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>End Session?</div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '14px' }}>
                  {(activeSession.games || []).filter(g => g.status === 'completed').length} games played {'\u00B7'} {(activeSession.session_players || []).length} players
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleEndSession} disabled={ending} style={{ flex: 1, padding: '12px', borderRadius: '10px', background: ending ? 'var(--surface2)' : 'var(--gold)', border: 'none', color: '#111', fontWeight: 700, fontSize: '13px', cursor: ending ? 'wait' : 'pointer', fontFamily: "'DM Sans', sans-serif" }}>{ending ? 'Ending...' : 'End & Reveal'}</button>
                  <button onClick={() => setShowEndConfirm(false)} style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
                </div>
              </div>
            )}

            {/* Delete entire session */}
            {!showDeleteSession ? (
              <button onClick={() => setShowDeleteSession(true)} style={{
                width: '100%', padding: '10px', borderRadius: '10px',
                background: 'transparent', border: 'none',
                color: 'var(--red)', fontWeight: 500, fontSize: '12px',
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                opacity: 0.6
              }}>
                {'\u{1F5D1}\u{FE0F}'} Delete Entire Session
              </button>
            ) : (
              <div style={{ marginTop: '8px', padding: '14px', background: 'var(--red-dim)', borderRadius: '12px', border: '1px solid var(--red)' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--red)', marginBottom: '8px' }}>
                  This will permanently delete this session, all games, and all session data.
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '10px' }}>
                  Type DELETE to confirm:
                </div>
                <input value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE" style={{
                    width: '100%', padding: '10px', borderRadius: '8px',
                    border: '1px solid var(--red)', background: 'var(--surface2)',
                    color: 'var(--text)', fontSize: '14px', outline: 'none',
                    fontFamily: "'DM Sans', sans-serif", marginBottom: '10px',
                    textAlign: 'center', letterSpacing: '0.15em'
                  }} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button disabled={deleteConfirmText !== 'DELETE'} onClick={async () => {
                    const sid = activeSession.id
                    await supabase.from('badges').delete().eq('session_id', sid)
                    await supabase.from('games').delete().eq('session_id', sid)
                    await supabase.from('session_players').delete().eq('session_id', sid)
                    await supabase.from('sessions').delete().eq('id', sid)
                    setShowDeleteSession(false)
                    setDeleteConfirmText('')
                    await loadActiveSession()
                    await loadPlayers()
                  }} style={{
                    flex: 1, padding: '12px', borderRadius: '10px',
                    background: deleteConfirmText === 'DELETE' ? 'var(--red)' : 'var(--surface2)',
                    border: 'none', color: deleteConfirmText === 'DELETE' ? '#fff' : 'var(--muted)',
                    fontWeight: 600, fontSize: '13px',
                    cursor: deleteConfirmText === 'DELETE' ? 'pointer' : 'not-allowed',
                    fontFamily: "'DM Sans', sans-serif"
                  }}>Delete Forever</button>
                  <button onClick={() => { setShowDeleteSession(false); setDeleteConfirmText('') }} style={{
                    flex: 1, padding: '12px', borderRadius: '10px',
                    background: 'var(--surface2)', border: '1px solid var(--border)',
                    color: 'var(--text)', fontWeight: 500, fontSize: '13px',
                    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif"
                  }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Upcoming sessions */}
        {upcoming.length > 0 && (
          <div style={{
            background: 'var(--surface)', borderRadius: '16px',
            border: '1px solid var(--border)', padding: '20px'
          }}>
            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Upcoming Sessions</div>
            {upcoming.map(s => (
              <div key={s.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 0', borderBottom: '1px solid var(--border)'
              }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>{s.title}</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                    {new Date(s.session_date + 'T00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    {' \u00B7 '}{s.session_time}
                  </div>
                </div>
                <button onClick={() => handleDeleteUpcoming(s.id)} style={{
                  background: 'none', border: 'none', color: 'var(--red)',
                  fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif"
                }}>Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </PinGate>
  )
}
