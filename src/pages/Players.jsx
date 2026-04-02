import { useState } from 'react'
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
            return (
              <div
                key={player.id}
                className="player-card"
                onClick={() => navigate(`/player/${player.id}`)}
              >
                <Avatar initials={player.initials} color={player.color} size={48} />
                <div className="player-card-info">
                  <span className="player-card-name">{player.name}</span>
                  <span className="player-card-rating" style={{ color: tier.color }}>
                    {player.skill_rating} {tier.label}
                  </span>
                  <span className="player-card-record">
                    {player.total_wins}W {player.total_losses}L
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
