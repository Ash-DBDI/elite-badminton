import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../context/SessionContext'
import { supabase } from '../lib/supabase'
import { getTier } from '../lib/eloEngine'
import Avatar from '../components/Avatar'

const COLORS = ['#c9a84c', '#4ab9d4', '#c44bd4', '#4cd98a', '#e85d4a', '#7b8cde', '#d4c44b', '#d47b4a']

export default function Players() {
  const { players, fetchPlayers, loading } = useSession()
  const navigate = useNavigate()
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [initials, setInitials] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [showInactive, setShowInactive] = useState(false)
  const [inactivePlayers, setInactivePlayers] = useState([])

  const isAdmin = sessionStorage.getItem('ebs_admin') === import.meta.env.VITE_ADMIN_PIN

  const loadInactivePlayers = async () => {
    const { data } = await supabase.from('players').select('*').eq('active', false).order('name')
    setInactivePlayers(data || [])
  }

  useEffect(() => {
    if (showInactive) loadInactivePlayers()
  }, [showInactive])

  const handleAdd = async () => {
    if (!name.trim() || !initials.trim()) return
    await supabase.from('players').insert({
      name: name.trim(),
      initials: initials.trim().toUpperCase(),
      color,
    })
    setName('')
    setInitials('')
    setShowAdd(false)
    await fetchPlayers()
  }

  const handleDelete = async (player) => {
    await supabase.from('players').update({ active: false }).eq('id', player.id)
    setConfirmDelete(null)
    await fetchPlayers()
    if (showInactive) await loadInactivePlayers()
  }

  const handleRestore = async (player) => {
    await supabase.from('players').update({ active: true }).eq('id', player.id)
    await fetchPlayers()
    await loadInactivePlayers()
  }

  if (loading) return <div className="page-loading">Loading...</div>

  return (
    <div className="page">
      <div className="card">
        <div className="card-header-row">
          <h2 className="card-title">Players</h2>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(!showAdd)}>
            {showAdd ? 'Cancel' : '+ Add'}
          </button>
        </div>

        {showAdd && (
          <div className="add-player-form">
            <input
              className="input"
              placeholder="Name"
              value={name}
              onChange={e => {
                setName(e.target.value)
                if (!initials || initials === name.split(' ').map(w => w[0]).join('').toUpperCase()) {
                  setInitials(e.target.value.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2))
                }
              }}
            />
            <input
              className="input"
              placeholder="Initials (2 chars)"
              value={initials}
              onChange={e => setInitials(e.target.value.toUpperCase().slice(0, 2))}
              maxLength={2}
            />
            <div className="color-picker">
              {COLORS.map(c => (
                <button
                  key={c}
                  className={`color-swatch ${color === c ? 'selected' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
            <button className="btn btn-primary" onClick={handleAdd}>Add Player</button>
          </div>
        )}

        <div className="player-grid">
          {players.map(player => {
            const tier = getTier(player.skill_rating)
            const ranked = player.total_games >= 20
            return (
              <div key={player.id} className="player-card">
                <div
                  className="player-card-clickable"
                  onClick={() => navigate(`/player/${player.id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, cursor: 'pointer' }}
                >
                  <Avatar initials={player.initials} color={player.color} size={48} />
                  <div className="player-card-info">
                    <span className="player-card-name">{player.name}</span>
                    {ranked ? (
                      <span className="player-card-rating" style={{ color: tier.color }}>
                        {player.skill_rating} {tier.label}
                      </span>
                    ) : (
                      <span className="player-card-rating" style={{ color: '#888' }}>Unranked</span>
                    )}
                    <span className="player-card-record">
                      {player.total_wins}W {player.total_losses}L
                    </span>
                  </div>
                </div>
                {isAdmin && (
                  <button
                    className="btn-icon-delete"
                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(player) }}
                    title={`Remove ${player.name}`}
                  >
                    {'\u{1F5D1}\u{FE0F}'}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {isAdmin && (
          <div className="inactive-toggle" style={{ marginTop: 16 }}>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => setShowInactive(!showInactive)}
            >
              {showInactive ? 'Hide inactive players' : 'Show inactive players'}
            </button>
          </div>
        )}

        {showInactive && isAdmin && inactivePlayers.length > 0 && (
          <div className="inactive-players" style={{ marginTop: 12 }}>
            <h4 style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Inactive Players</h4>
            <div className="player-grid">
              {inactivePlayers.map(player => {
                const tier = getTier(player.skill_rating)
                const ranked = player.total_games >= 20
                return (
                  <div key={player.id} className="player-card" style={{ opacity: 0.5 }}>
                    <Avatar initials={player.initials} color={player.color} size={48} />
                    <div className="player-card-info" style={{ flex: 1 }}>
                      <span className="player-card-name">{player.name}</span>
                      {ranked ? (
                        <span className="player-card-rating" style={{ color: tier.color }}>
                          {player.skill_rating} {tier.label}
                        </span>
                      ) : (
                        <span className="player-card-rating" style={{ color: '#888' }}>Unranked</span>
                      )}
                      <span className="player-card-record">
                        {player.total_wins}W {player.total_losses}L
                      </span>
                    </div>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handleRestore(player)}
                    >
                      Restore
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {showInactive && isAdmin && inactivePlayers.length === 0 && (
          <p className="empty-state" style={{ marginTop: 8 }}>No inactive players</p>
        )}
      </div>

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3>Remove {confirmDelete.name}?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '8px 0 16px' }}>
              Their stats and history will be kept.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => handleDelete(confirmDelete)}>
                Remove
              </button>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setConfirmDelete(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
