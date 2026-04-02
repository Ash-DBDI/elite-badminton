import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../context/SessionContext'
import Avatar from '../components/Avatar'

export default function SessionSetup() {
  const navigate = useNavigate()
  const {
    activeSession, sessionPlayers, players, loading,
    createSession, addPlayerToSession, removePlayerFromSession,
    updatePlayerStatus, startSession
  } = useSession()

  const [duration, setDuration] = useState(120)
  const [pinInput, setPinInput] = useState('')
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    if (activeSession?.status === 'active') navigate('/live')
  }, [activeSession, navigate])

  const handleAuth = () => {
    if (pinInput === import.meta.env.VITE_ADMIN_PIN) {
      setAuthenticated(true)
    } else {
      alert('Incorrect PIN')
    }
  }

  const handleCreateSession = async () => {
    const session = await createSession(duration)
    for (const player of players) {
      await addPlayerToSession(session.id, player.id)
    }
  }

  const handleStart = async () => {
    const herePlayers = sessionPlayers.filter(sp => sp.status === 'here')
    if (herePlayers.length < 4) {
      alert('Need at least 4 players marked as "here" to start')
      return
    }
    await startSession(activeSession.id)
    navigate('/live')
  }

  if (loading) return <div className="page-loading">Loading...</div>

  if (!authenticated) {
    return (
      <div className="page auth-page">
        <div className="card auth-card">
          <h2>Admin PIN</h2>
          <p>Enter PIN to manage sessions</p>
          <input
            type="password"
            className="input"
            value={pinInput}
            onChange={e => setPinInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAuth()}
            placeholder="Enter PIN"
            maxLength={6}
          />
          <button className="btn btn-primary" onClick={handleAuth}>Enter</button>
        </div>
      </div>
    )
  }

  if (!activeSession) {
    return (
      <div className="page">
        <div className="card">
          <h2>New Session</h2>
          <label className="form-label">Duration (minutes)</label>
          <div className="duration-picker">
            {[60, 90, 120, 150, 180].map(d => (
              <button
                key={d}
                className={`btn btn-sm ${duration === d ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setDuration(d)}
              >
                {d}m
              </button>
            ))}
          </div>
          <button className="btn btn-primary btn-lg" onClick={handleCreateSession}>
            Create Session
          </button>
        </div>
      </div>
    )
  }

  const statusOrder = { here: 0, otw: 1, absent: 2 }
  const sortedPlayers = [...sessionPlayers]
    .map(sp => ({ ...sp, player: players.find(p => p.id === sp.player_id) }))
    .filter(sp => sp.player)
    .sort((a, b) => (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3))

  const hereCount = sessionPlayers.filter(sp => sp.status === 'here').length

  return (
    <div className="page">
      <div className="card">
        <div className="session-header">
          <h2>Session Setup</h2>
          <span className="badge">{hereCount} / {sessionPlayers.length} here</span>
        </div>

        <div className="player-list">
          {sortedPlayers.map(sp => (
            <div key={sp.id} className="player-row">
              <Avatar initials={sp.player.initials} color={sp.player.color} size={36} />
              <span className="player-name">{sp.player.name}</span>
              <div className="status-buttons">
                {['here', 'otw', 'absent'].map(s => (
                  <button
                    key={s}
                    className={`btn btn-xs ${sp.status === s ? 'btn-status-active' : 'btn-status'}`}
                    onClick={() => updatePlayerStatus(sp.id, s)}
                  >
                    {s === 'here' ? '\u{2705}' : s === 'otw' ? '\u{1F6B6}' : '\u{274C}'}
                  </button>
                ))}
                <button
                  className="btn btn-xs btn-danger"
                  onClick={() => removePlayerFromSession(activeSession.id, sp.player_id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {players.filter(p => !sessionPlayers.find(sp => sp.player_id === p.id)).length > 0 && (
          <div className="add-players">
            <h4>Add Players</h4>
            <div className="player-chips">
              {players
                .filter(p => !sessionPlayers.find(sp => sp.player_id === p.id))
                .map(p => (
                  <button
                    key={p.id}
                    className="btn btn-sm btn-secondary"
                    onClick={() => addPlayerToSession(activeSession.id, p.id)}
                  >
                    + {p.name}
                  </button>
                ))}
            </div>
          </div>
        )}

        <button
          className="btn btn-primary btn-lg"
          onClick={handleStart}
          disabled={hereCount < 4}
        >
          Start Session ({hereCount} players)
        </button>
      </div>
    </div>
  )
}
