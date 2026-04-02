import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'
import { tier } from '../lib/elo'
import Avatar from '../components/Avatar'
import PinGate from '../components/PinGate'

export default function Players() {
  const { players, loadPlayers, isAdmin } = useApp()
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [expanded, setExpanded] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [showInactive, setShowInactive] = useState(false)
  const [inactive, setInactive] = useState([])

  async function handleAdd() {
    if (!name.trim()) return
    const words = name.trim().split(' ')
    const initials = words.length >= 2
      ? (words[0][0] + words[words.length - 1][0]).toUpperCase()
      : name.trim().slice(0, 2).toUpperCase()
    await supabase.from('players').insert({ name: name.trim(), initials })
    setName('')
    setShowAdd(false)
    await loadPlayers()
  }

  async function handleDelete(p) {
    await supabase.from('players').update({ active: false }).eq('id', p.id)
    setConfirmDelete(null)
    await loadPlayers()
    if (showInactive) loadInactive()
  }

  async function handleRestore(p) {
    await supabase.from('players').update({ active: true }).eq('id', p.id)
    await loadPlayers()
    loadInactive()
  }

  async function loadInactive() {
    const { data } = await supabase.from('players').select('*').eq('active', false).order('name')
    setInactive(data || [])
  }

  function toggleInactive() {
    if (!showInactive) loadInactive()
    setShowInactive(!showInactive)
  }

  return (
    <div className="screen" style={{ padding: '20px 16px 90px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px', fontWeight: 300 }}>Players</div>
        {isAdmin && (
          <button onClick={() => setShowAdd(!showAdd)} style={{
            padding: '8px 16px', borderRadius: '10px',
            background: showAdd ? 'var(--surface2)' : 'var(--gold)',
            border: 'none', color: showAdd ? 'var(--text)' : '#111',
            fontWeight: 600, fontSize: '12px', cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif"
          }}>
            {showAdd ? 'Cancel' : '+ Add Player'}
          </button>
        )}
      </div>

      {/* Add player form */}
      {showAdd && isAdmin && (
        <div style={{
          background: 'var(--surface)', borderRadius: '12px',
          border: '1px solid var(--border)', padding: '16px', marginBottom: '16px'
        }}>
          <input value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Player name" style={{
              width: '100%', padding: '12px', borderRadius: '10px',
              border: '1px solid var(--border)', background: 'var(--surface2)',
              color: 'var(--text)', fontSize: '14px', outline: 'none',
              fontFamily: "'DM Sans', sans-serif", marginBottom: '10px'
            }} />
          <button onClick={handleAdd} style={{
            width: '100%', padding: '12px', borderRadius: '10px',
            background: 'var(--gold)', border: 'none', color: '#111',
            fontWeight: 600, fontSize: '13px', cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif"
          }}>Save Player</button>
        </div>
      )}

      {/* Player list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {players.map((p, i) => {
          const t = tier(p.skill_rating, p.total_games)
          const winPct = p.total_games >= 10 ? Math.round((p.total_wins / p.total_games) * 100) + '%' : '\u2014'
          const isExpanded = expanded === p.id

          return (
            <div key={p.id}>
              <div style={{
                background: 'var(--surface)', borderRadius: '12px',
                border: '1px solid var(--border)', padding: '14px 16px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px'
              }} onClick={() => setExpanded(isExpanded ? null : p.id)}>
                <Avatar initials={p.initials} size={40} index={i} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '2px' }}>{p.name}</div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                      {p.total_wins}W {'\u00B7'} {p.total_losses}L
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                      {winPct}
                    </span>
                    <span style={{ fontSize: '10px', color: t.color, fontWeight: 600 }}>{t.label}</span>
                  </div>
                  {p.current_streak >= 2 && (
                    <div style={{ fontSize: '11px', color: '#e05252', marginTop: '2px' }}>
                      {'\u{1F525}'} {p.current_streak} win streak
                    </div>
                  )}
                </div>
                {isAdmin && (
                  <button onClick={e => { e.stopPropagation(); setConfirmDelete(p) }} style={{
                    background: 'none', border: 'none', fontSize: '16px',
                    cursor: 'pointer', padding: '4px', opacity: 0.4
                  }}>
                    {'\u{1F5D1}\u{FE0F}'}
                  </button>
                )}
              </div>

              {/* Expanded stats */}
              {isExpanded && (
                <div style={{
                  background: 'var(--surface2)', borderRadius: '0 0 12px 12px',
                  padding: '12px 16px', marginTop: '-6px',
                  display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px',
                  fontSize: '12px'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: 'var(--muted)', fontSize: '10px', marginBottom: '2px' }}>Games</div>
                    <div style={{ fontWeight: 700 }}>{p.total_games}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: 'var(--muted)', fontSize: '10px', marginBottom: '2px' }}>Pts For</div>
                    <div style={{ fontWeight: 700 }}>{p.total_points_scored}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: 'var(--muted)', fontSize: '10px', marginBottom: '2px' }}>Pts Against</div>
                    <div style={{ fontWeight: 700 }}>{p.total_points_conceded}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: 'var(--muted)', fontSize: '10px', marginBottom: '2px' }}>Best Streak</div>
                    <div style={{ fontWeight: 700 }}>{p.best_streak}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: 'var(--muted)', fontSize: '10px', marginBottom: '2px' }}>Pt Diff</div>
                    <div style={{ fontWeight: 700, color: (p.total_points_scored - p.total_points_conceded) >= 0 ? 'var(--green)' : 'var(--red)' }}>
                      {(p.total_points_scored - p.total_points_conceded) > 0 ? '+' : ''}{p.total_points_scored - p.total_points_conceded}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: 'var(--muted)', fontSize: '10px', marginBottom: '2px' }}>Rating</div>
                    <div style={{ fontWeight: 700 }}>{p.total_games >= 20 ? p.skill_rating : '\u2014'}</div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Inactive toggle */}
      {isAdmin && (
        <button onClick={toggleInactive} style={{
          marginTop: '16px', padding: '10px', width: '100%',
          borderRadius: '10px', border: '1px solid var(--border)',
          background: 'var(--surface2)', color: 'var(--muted)',
          fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif"
        }}>
          {showInactive ? 'Hide inactive players' : 'Show inactive players'}
        </button>
      )}

      {showInactive && isAdmin && inactive.map((p, i) => (
        <div key={p.id} style={{
          background: 'var(--surface)', borderRadius: '12px',
          border: '1px solid var(--border)', padding: '12px 16px',
          marginTop: '6px', display: 'flex', alignItems: 'center', gap: '12px',
          opacity: 0.5
        }}>
          <Avatar initials={p.initials} size={36} index={i} />
          <div style={{ flex: 1, fontWeight: 500, fontSize: '14px' }}>{p.name}</div>
          <button onClick={() => handleRestore(p)} style={{
            padding: '6px 14px', borderRadius: '8px',
            background: 'var(--gold)', border: 'none', color: '#111',
            fontWeight: 600, fontSize: '11px', cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif"
          }}>Restore</button>
        </div>
      ))}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div onClick={() => setConfirmDelete(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 300, padding: '16px'
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'var(--surface)', borderRadius: '16px',
            border: '1px solid var(--border)', padding: '24px',
            maxWidth: '300px', width: '100%', textAlign: 'center'
          }}>
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
              Remove {confirmDelete.name}?
            </div>
            <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '20px' }}>
              Their stats and history will be kept.
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => handleDelete(confirmDelete)} style={{
                flex: 1, padding: '12px', borderRadius: '10px',
                background: 'var(--red)', border: 'none', color: '#fff',
                fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif"
              }}>Remove</button>
              <button onClick={() => setConfirmDelete(null)} style={{
                flex: 1, padding: '12px', borderRadius: '10px',
                background: 'var(--surface2)', border: '1px solid var(--border)',
                color: 'var(--text)', fontWeight: 500, fontSize: '13px',
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif"
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
