import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'
import { tier } from '../lib/elo'
import Avatar from '../components/Avatar'
import { AVATARS } from '../components/avatars/index.jsx'

export default function Players() {
  const { players, loadPlayers, isAdmin } = useApp()
  const navigate = useNavigate()
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState(1)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [showInactive, setShowInactive] = useState(false)
  const [inactive, setInactive] = useState([])
  const [editing, setEditing] = useState(null)
  const [editName, setEditName] = useState('')
  const [editAvatar, setEditAvatar] = useState(1)

  async function handleAdd() {
    if (!name.trim()) return
    const words = name.trim().split(' ')
    const initials = words.length >= 2 ? (words[0][0] + words[words.length - 1][0]).toUpperCase() : name.trim().slice(0, 2).toUpperCase()
    await supabase.from('players').insert({ name: name.trim(), initials, avatar_id: selectedAvatar })
    setName(''); setSelectedAvatar(1); setShowAdd(false); await loadPlayers()
  }

  async function handleDelete(p) {
    await supabase.from('players').update({ active: false }).eq('id', p.id)
    setConfirmDelete(null); await loadPlayers(); if (showInactive) loadInactive()
  }

  async function handleRestore(p) {
    await supabase.from('players').update({ active: true }).eq('id', p.id)
    await loadPlayers(); loadInactive()
  }

  async function loadInactive() {
    const { data } = await supabase.from('players').select('*').eq('active', false).order('name')
    setInactive(data || [])
  }

  async function handleEditSave(p) {
    if (!editName.trim()) return
    const words = editName.trim().split(' ')
    const initials = words.length >= 2 ? (words[0][0] + words[words.length - 1][0]).toUpperCase() : editName.trim().slice(0, 2).toUpperCase()
    await supabase.from('players').update({ name: editName.trim(), initials, avatar_id: editAvatar }).eq('id', p.id)
    setEditing(null); await loadPlayers()
  }

  const inp = { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: '14px', outline: 'none', fontFamily: "'DM Sans', sans-serif", marginBottom: '10px' }

  function AvatarPicker({ value, onChange }) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px', marginBottom: '10px' }}>
        {AVATARS.map(av => {
          const Comp = av.Component
          return (
            <div key={av.id} onClick={() => onChange(av.id)} style={{
              width: '100%', aspectRatio: '1', borderRadius: '50%', overflow: 'hidden', cursor: 'pointer',
              border: value === av.id ? '3px solid var(--gold)' : '3px solid transparent',
              boxSizing: 'border-box', transition: 'border-color 0.15s'
            }}>
              <Comp />
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="screen" style={{ padding: '20px 16px 90px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px', fontWeight: 300 }}>Players</div>
        {isAdmin && (
          <button onClick={() => setShowAdd(!showAdd)} style={{ padding: '8px 16px', borderRadius: '10px', background: showAdd ? 'var(--surface2)' : 'var(--gold)', border: 'none', color: showAdd ? 'var(--text)' : '#111', fontWeight: 600, fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
            {showAdd ? 'Cancel' : '+ Add Player'}
          </button>
        )}
      </div>

      {/* Add player form with avatar picker */}
      {showAdd && isAdmin && (
        <div style={{ background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', padding: '16px', marginBottom: '16px' }}>
          <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} placeholder="Player name" style={inp} />
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '6px', fontWeight: 600 }}>Choose avatar</div>
          <AvatarPicker value={selectedAvatar} onChange={setSelectedAvatar} />
          <button onClick={handleAdd} style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--gold)', border: 'none', color: '#111', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Save Player</button>
        </div>
      )}

      {/* Player list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {players.map((p, i) => {
          const t = tier(p.skill_rating, p.total_games)
          const winPct = p.total_games > 0 ? Math.round((p.total_wins / p.total_games) * 100) + '%' : '\u2014'
          const isEditing = editing === p.id

          return (
            <div key={p.id}>
              <div style={{ background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Tappable area → navigate to detail */}
                <div onClick={() => navigate(`/players/${p.id}`)} style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, cursor: 'pointer' }}>
                  <Avatar initials={p.initials} size={40} index={i} avatarId={p.avatar_id} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '2px' }}>{p.name}</div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{p.total_wins}W {'\u00B7'} {p.total_losses}L</span>
                      <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{winPct}</span>
                      <span style={{ fontSize: '10px', color: t.color, fontWeight: 600 }}>{t.label}</span>
                    </div>
                    {p.current_streak >= 2 && <div style={{ fontSize: '11px', color: '#e05252', marginTop: '2px' }}>{'\u{1F525}'} {p.current_streak} win streak</div>}
                  </div>
                </div>
                {/* Admin buttons */}
                {isAdmin && (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={e => { e.stopPropagation(); setEditing(isEditing ? null : p.id); setEditName(p.name); setEditAvatar(p.avatar_id || 1) }} style={{ background: 'none', border: 'none', fontSize: '14px', cursor: 'pointer', opacity: 0.4, padding: '4px' }}>{'\u{270F}\u{FE0F}'}</button>
                    <button onClick={e => { e.stopPropagation(); setConfirmDelete(p) }} style={{ background: 'none', border: 'none', fontSize: '14px', cursor: 'pointer', opacity: 0.4, padding: '4px' }}>{'\u{1F5D1}\u{FE0F}'}</button>
                  </div>
                )}
              </div>

              {/* Edit panel */}
              {isEditing && isAdmin && (
                <div style={{ background: 'var(--surface2)', borderRadius: '0 0 12px 12px', padding: '14px 16px', marginTop: '-6px' }}>
                  <input value={editName} onChange={e => setEditName(e.target.value)} style={inp} />
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '6px', fontWeight: 600 }}>Avatar</div>
                  <AvatarPicker value={editAvatar} onChange={setEditAvatar} />
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => handleEditSave(p)} style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'var(--gold)', border: 'none', color: '#111', fontWeight: 600, fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Save</button>
                    <button onClick={() => setEditing(null)} style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Inactive */}
      {isAdmin && (
        <button onClick={() => { if (!showInactive) loadInactive(); setShowInactive(!showInactive) }} style={{ marginTop: '16px', padding: '10px', width: '100%', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--muted)', fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
          {showInactive ? 'Hide inactive players' : 'Show inactive players'}
        </button>
      )}
      {showInactive && isAdmin && inactive.map((p, i) => (
        <div key={p.id} style={{ background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', padding: '12px 16px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '12px', opacity: 0.5 }}>
          <Avatar initials={p.initials} size={36} index={i} avatarId={p.avatar_id} />
          <div style={{ flex: 1, fontWeight: 500, fontSize: '14px' }}>{p.name}</div>
          <button onClick={() => handleRestore(p)} style={{ padding: '6px 14px', borderRadius: '8px', background: 'var(--gold)', border: 'none', color: '#111', fontWeight: 600, fontSize: '11px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Restore</button>
        </div>
      ))}

      {/* Delete modal */}
      {confirmDelete && (
        <div onClick={() => setConfirmDelete(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '16px' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', padding: '24px', maxWidth: '300px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Remove {confirmDelete.name}?</div>
            <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '20px' }}>Stats and history will be kept.</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => handleDelete(confirmDelete)} style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'var(--red)', border: 'none', color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Remove</button>
              <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
