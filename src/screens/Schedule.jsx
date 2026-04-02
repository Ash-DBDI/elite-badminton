import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'
import { expectedScore, updatedRating, teamRating } from '../lib/elo'
import { reshuffleRemaining } from '../lib/pairing'
import Avatar from '../components/Avatar'
import PinGate from '../components/PinGate'
import Header from '../components/Header'

const pmBtn = {
  width: '56px', height: '64px', borderRadius: '12px',
  fontSize: '24px', fontWeight: 700, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: "'DM Sans', sans-serif", border: 'none'
}

function ScoreControl({ label, value, onChange }) {
  const num = parseInt(value) || 0
  function handleType(e) {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 2)
    const n = parseInt(val)
    if (val === '') { onChange(''); return }
    onChange(String(Math.min(30, n)))
  }
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
        <button onClick={() => onChange(String(Math.max(0, num - 1)))} style={{ ...pmBtn, background: 'var(--surface2)', color: 'var(--text)' }}>{'\u2212'}</button>
        <input type="text" inputMode="numeric" pattern="[0-9]*" className="score-input"
          value={value} onChange={handleType} />
        <button onClick={() => onChange(String(Math.min(30, num + 1)))} style={{ ...pmBtn, background: 'var(--gold-dim)', color: 'var(--gold)', border: '1px solid var(--gold-border)' }}>{'\uFF0B'}</button>
      </div>
    </div>
  )
}

export default function Schedule() {
  const { activeSession, loadActiveSession, players, loadPlayers, isAdmin } = useApp()
  const [scoreA, setScoreA] = useState('')
  const [scoreB, setScoreB] = useState('')
  const [showCompleted, setShowCompleted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [scoreError, setScoreError] = useState('')
  const [editingGame, setEditingGame] = useState(null)
  const [editA, setEditA] = useState('')
  const [editB, setEditB] = useState('')
  const [editError, setEditError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [showSwap, setShowSwap] = useState(false)
  const [swapOut, setSwapOut] = useState('')
  const [swapIn, setSwapIn] = useState('')
  const [swapMsg, setSwapMsg] = useState('')

  useEffect(() => { loadActiveSession() }, [])
  useEffect(() => {
    const chan = supabase.channel('schedule-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, () => loadActiveSession())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => loadActiveSession())
      .subscribe()
    return () => { supabase.removeChannel(chan) }
  }, [])

  if (!activeSession) {
    return (
      <div className="screen" style={{ padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>{'\u{1F4CB}'}</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '22px', fontWeight: 300 }}>No active session</div>
        <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '8px' }}>Start a session from the Admin tab</div>
      </div>
    )
  }

  const allGames = activeSession.games || []
  const completed = allGames.filter(g => g.status === 'completed').sort((a, b) => a.game_number - b.game_number)
  const pending = allGames.filter(g => g.status === 'pending').sort((a, b) => a.game_number - b.game_number)
  const activeGame = allGames.find(g => g.status === 'active')
  const currentGame = activeGame || pending[0]
  const upcomingPending = activeGame ? pending.slice(0, 3) : pending.slice(1, 4)

  const pMap = {}
  players.forEach((p, i) => { pMap[p.id] = { ...p, _i: i } })
  const spList = activeSession.session_players || []
  spList.forEach((sp, i) => {
    if (sp.players && !pMap[sp.player_id]) pMap[sp.player_id] = { ...sp.players, _i: i }
    else if (sp.players) pMap[sp.player_id] = { ...pMap[sp.player_id], ...sp.players, _i: pMap[sp.player_id]._i ?? i }
  })
  const P = (id) => pMap[id] || { name: '?', initials: '??', _i: 0 }

  function validate(a, b) {
    const na = parseInt(a), nb = parseInt(b)
    if (a === '' || b === '' || isNaN(na) || isNaN(nb)) return 'Enter both scores'
    if (na < 0 || nb < 0) return 'Scores cannot be negative'
    if (na === nb) return 'Scores cannot be tied'
    if (Math.max(na, nb) < 21) return 'Winner must have at least 21 points'
    return null
  }

  async function handleSubmitScore() {
    if (!currentGame || submitting) return
    setScoreError('')
    const err = validate(scoreA, scoreB)
    if (err) { setScoreError(err); return }
    const a = parseInt(scoreA), b = parseInt(scoreB)
    setSubmitting(true)
    try {
      await supabase.from('games').update({ team_a_score: a, team_b_score: b, status: 'completed', locked: true, completed_at: new Date().toISOString() }).eq('id', currentGame.id)
      const teamAWon = a > b
      const fourIds = [currentGame.team_a_player1, currentGame.team_a_player2, currentGame.team_b_player1, currentGame.team_b_player2]
      for (const pid of fourIds) {
        const sp = spList.find(s => s.player_id === pid); if (!sp) continue
        const inA = [currentGame.team_a_player1, currentGame.team_a_player2].includes(pid)
        const won = inA ? teamAWon : !teamAWon
        await supabase.from('session_players').update({ games_played: sp.games_played + 1, games_won: sp.games_won + (won ? 1 : 0), points_scored: sp.points_scored + (inA ? a : b), points_conceded: sp.points_conceded + (inA ? b : a) }).eq('id', sp.id)
      }
      const rA = teamRating(P(currentGame.team_a_player1).skill_rating, P(currentGame.team_a_player2).skill_rating)
      const rB = teamRating(P(currentGame.team_b_player1).skill_rating, P(currentGame.team_b_player2).skill_rating)
      const expA = expectedScore(rA, rB)
      for (const pid of fourIds) {
        const p = P(pid); const inA = [currentGame.team_a_player1, currentGame.team_a_player2].includes(pid)
        const won = inA ? teamAWon : !teamAWon; const newR = updatedRating(p.skill_rating, inA ? expA : 1 - expA, won ? 1 : 0)
        const ns = won ? (p.current_streak || 0) + 1 : 0
        await supabase.from('players').update({ skill_rating: newR, total_games: (p.total_games || 0) + 1, total_wins: (p.total_wins || 0) + (won ? 1 : 0), total_losses: (p.total_losses || 0) + (won ? 0 : 1), total_points_scored: (p.total_points_scored || 0) + (inA ? a : b), total_points_conceded: (p.total_points_conceded || 0) + (inA ? b : a), current_streak: ns, best_streak: Math.max(p.best_streak || 0, ns) }).eq('id', pid)
      }
      const updComp = [...completed, { ...currentGame, team_a_score: a, team_b_score: b }]
      await supabase.from('games').delete().eq('session_id', activeSession.id).eq('status', 'pending')
      const { data: freshSp } = await supabase.from('session_players').select('*, players(*)').eq('session_id', activeSession.id)
      const ap = (freshSp || []).filter(s => s.checked_in).map(s => s.players).filter(Boolean)
      if (ap.length >= 4) {
        const pc = Math.max(0, Math.floor((activeSession.duration_minutes || 120) / 12) - updComp.length)
        if (pc > 0) { const rs = reshuffleRemaining(ap, updComp, pc, currentGame.game_number + 1); if (rs.length > 0) await supabase.from('games').insert(rs.map((g, i) => ({ session_id: activeSession.id, game_number: g.game_number, status: i === 0 ? 'active' : 'pending', team_a_player1: g.team_a_player1, team_a_player2: g.team_a_player2, team_b_player1: g.team_b_player1, team_b_player2: g.team_b_player2, sitting_out: g.sitting_out, balance_score: g.balance_score }))) }
      }
      const winners = teamAWon ? [currentGame.team_a_player1, currentGame.team_a_player2] : [currentGame.team_b_player1, currentGame.team_b_player2]
      if ((teamAWon ? a : b) === 21 && (teamAWon ? b : a) <= 9) for (const pid of winners) await supabase.from('badges').insert({ player_id: pid, session_id: activeSession.id, badge_type: 'LIGHTNING' })
      if (currentGame.game_number === 1) for (const pid of winners) await supabase.from('badges').insert({ player_id: pid, session_id: activeSession.id, badge_type: 'FIRST_BLOOD' })
      const allComp = [...updComp].sort((x, y) => x.game_number - y.game_number)
      for (const pid of fourIds) {
        const pg = allComp.filter(g => [g.team_a_player1, g.team_a_player2, g.team_b_player1, g.team_b_player2].includes(pid))
        let st = 0; for (const g of pg) { const iA = [g.team_a_player1, g.team_a_player2].includes(pid); if (iA ? g.team_a_score > g.team_b_score : g.team_b_score > g.team_a_score) st++; else st = 0 }
        if (st >= 3) { const { data: ex } = await supabase.from('badges').select('id').eq('player_id', pid).eq('session_id', activeSession.id).eq('badge_type', 'HOT_HAND'); if (!ex?.length) await supabase.from('badges').insert({ player_id: pid, session_id: activeSession.id, badge_type: 'HOT_HAND' }) }
      }
      setScoreA(''); setScoreB(''); setScoreError(''); await loadActiveSession(); await loadPlayers()
    } catch (err) { console.error(err); setScoreError('Error submitting score') }
    finally { setSubmitting(false) }
  }

  async function handleDeleteGame(game) {
    if (game.status === 'completed') {
      const fourIds = [game.team_a_player1, game.team_a_player2, game.team_b_player1, game.team_b_player2]
      const aWon = game.team_a_score > game.team_b_score
      for (const pid of fourIds) {
        const sp = spList.find(s => s.player_id === pid); if (!sp) continue
        const inA = [game.team_a_player1, game.team_a_player2].includes(pid); const won = inA ? aWon : !aWon
        await supabase.from('session_players').update({ games_played: Math.max(0, sp.games_played - 1), games_won: Math.max(0, sp.games_won - (won ? 1 : 0)), points_scored: Math.max(0, sp.points_scored - (inA ? game.team_a_score : game.team_b_score)), points_conceded: Math.max(0, sp.points_conceded - (inA ? game.team_b_score : game.team_a_score)) }).eq('id', sp.id)
      }
    }
    await supabase.from('games').delete().eq('id', game.id); setConfirmDelete(null); await loadActiveSession()
  }

  async function handleEditSave(game) {
    setEditError(''); const err = validate(editA, editB); if (err) { setEditError(err); return }
    const a = parseInt(editA), b = parseInt(editB)
    const fourIds = [game.team_a_player1, game.team_a_player2, game.team_b_player1, game.team_b_player2]
    const oldAWon = game.team_a_score > game.team_b_score
    for (const pid of fourIds) {
      const sp = spList.find(s => s.player_id === pid); if (!sp) continue
      const inA = [game.team_a_player1, game.team_a_player2].includes(pid); const oldWon = inA ? oldAWon : !oldAWon
      await supabase.from('session_players').update({ games_played: Math.max(0, sp.games_played - 1), games_won: Math.max(0, sp.games_won - (oldWon ? 1 : 0)), points_scored: Math.max(0, sp.points_scored - (inA ? game.team_a_score : game.team_b_score)), points_conceded: Math.max(0, sp.points_conceded - (inA ? game.team_b_score : game.team_a_score)) }).eq('id', sp.id)
    }
    const newAWon = a > b
    const { data: freshSp } = await supabase.from('session_players').select('*').eq('session_id', activeSession.id)
    for (const pid of fourIds) {
      const sp = (freshSp || []).find(s => s.player_id === pid); if (!sp) continue
      const inA = [game.team_a_player1, game.team_a_player2].includes(pid); const won = inA ? newAWon : !newAWon
      await supabase.from('session_players').update({ games_played: sp.games_played + 1, games_won: sp.games_won + (won ? 1 : 0), points_scored: sp.points_scored + (inA ? a : b), points_conceded: sp.points_conceded + (inA ? b : a) }).eq('id', sp.id)
    }
    await supabase.from('games').update({ team_a_score: a, team_b_score: b }).eq('id', game.id)
    setEditingGame(null); await loadActiveSession()
  }

  async function handleRegenerate() {
    const ap = spList.filter(s => s.checked_in).map(s => s.players).filter(Boolean)
    if (ap.length < 4) return alert('Need at least 4 checked-in players')
    const pg = allGames.filter(g => g.status === 'pending').sort((a2, b2) => a2.game_number - b2.game_number)
    if (pg.length === 0) return
    await supabase.from('games').delete().eq('session_id', activeSession.id).eq('status', 'pending')
    const rs = reshuffleRemaining(ap, completed, pg.length, pg[0].game_number)
    if (rs.length > 0) await supabase.from('games').insert(rs.map(g => ({ session_id: activeSession.id, game_number: g.game_number, status: 'pending', team_a_player1: g.team_a_player1, team_a_player2: g.team_a_player2, team_b_player1: g.team_b_player1, team_b_player2: g.team_b_player2, sitting_out: g.sitting_out, balance_score: g.balance_score })))
    await loadActiveSession()
  }

  // SWAP
  async function handleSwap() {
    if (!swapOut || !swapIn || !activeGame) return
    const update = {}
    const slots = ['team_a_player1', 'team_a_player2', 'team_b_player1', 'team_b_player2']
    for (const slot of slots) { if (activeGame[slot] === swapOut) update[slot] = swapIn }
    const newSitting = (activeGame.sitting_out || []).filter(id => id !== swapIn).concat(swapOut)
    update.sitting_out = newSitting
    await supabase.from('games').update(update).eq('id', activeGame.id)
    setSwapMsg(`${P(swapIn).name} is now playing, ${P(swapOut).name} is sitting out`)
    setShowSwap(false); setSwapOut(''); setSwapIn('')
    await loadActiveSession()
    setTimeout(() => setSwapMsg(''), 4000)
  }

  const currentFourIds = currentGame ? [currentGame.team_a_player1, currentGame.team_a_player2, currentGame.team_b_player1, currentGame.team_b_player2] : []
  const sittingOutPlayers = spList.filter(s => s.checked_in && !currentFourIds.includes(s.player_id)).map(s => s.players).filter(Boolean)

  function GameCard({ game, isCurrent }) {
    const isActive = game.status === 'active'
    const isDone = game.status === 'completed'
    const isPending = game.status === 'pending'
    const isEditing = editingGame === game.id
    return (
      <div style={{ background: 'var(--surface)', borderRadius: '16px', border: `1px solid ${isCurrent ? 'var(--gold-border)' : 'var(--border)'}`, padding: isCurrent ? '20px' : '14px 16px', marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Game {game.game_number}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isActive && <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--green)', background: 'var(--green-dim)', padding: '3px 10px', borderRadius: '8px' }}>NOW PLAYING</span>}
            {isPending && <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--muted)' }}>Up next</span>}
            {isDone && <span style={{ fontSize: '10px', color: 'var(--muted)' }}>{'\u{1F512}'} Locked</span>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            {[game.team_a_player1, game.team_a_player2].map(id => { const p = P(id); return <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', justifyContent: 'center' }}><Avatar initials={p.initials} size={isCurrent ? 28 : 22} index={p._i} avatarId={p.avatar_id} /><span style={{ fontSize: isCurrent ? '13px' : '11px', fontWeight: 500 }}>{p.name}</span></div> })}
            {isDone && !isEditing && <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '6px', color: game.team_a_score > game.team_b_score ? 'var(--gold)' : 'var(--muted)' }}>{game.team_a_score}</div>}
          </div>
          <div style={{ textAlign: 'center', minWidth: '60px' }}>
            <div style={{ fontSize: isCurrent ? '16px' : '12px', fontWeight: 800, color: 'var(--muted)', marginBottom: '4px' }}>VS</div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--green)', background: 'var(--green-dim)', padding: '2px 8px', borderRadius: '8px' }}>{'\u{26A1}'} {game.balance_score}%</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            {[game.team_b_player1, game.team_b_player2].map(id => { const p = P(id); return <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', justifyContent: 'center' }}><Avatar initials={p.initials} size={isCurrent ? 28 : 22} index={p._i} avatarId={p.avatar_id} /><span style={{ fontSize: isCurrent ? '13px' : '11px', fontWeight: 500 }}>{p.name}</span></div> })}
            {isDone && !isEditing && <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '6px', color: game.team_b_score > game.team_a_score ? 'var(--gold)' : 'var(--muted)' }}>{game.team_b_score}</div>}
          </div>
        </div>
        {game.sitting_out?.length > 0 && <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '10px', textAlign: 'center' }}>Sitting out: {game.sitting_out.map(id => P(id).name).join(', ')}</div>}

        {/* Admin: completed game buttons */}
        {isDone && isAdmin && !isEditing && (
          <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
            <button onClick={() => { setEditingGame(game.id); setEditA(String(game.team_a_score)); setEditB(String(game.team_b_score)); setEditError('') }} style={{ flex: 1, padding: '8px', borderRadius: '8px', background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '11px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>{'\u{270F}\u{FE0F}'} Edit Score</button>
            <button onClick={() => setConfirmDelete(game)} style={{ flex: 1, padding: '8px', borderRadius: '8px', background: 'var(--red-dim)', border: '1px solid var(--red)', color: 'var(--red)', fontSize: '11px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>{'\u{1F5D1}\u{FE0F}'} Delete</button>
          </div>
        )}
        {isDone && isEditing && (
          <div style={{ marginTop: '14px' }}>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'flex-start', marginBottom: '8px' }}>
              <ScoreControl label={P(game.team_a_player1).name + ' & ' + P(game.team_a_player2).name} value={editA} onChange={setEditA} />
              <div style={{ paddingTop: '28px', fontSize: '16px', fontWeight: 800, color: 'var(--muted)' }}>{'\u2013'}</div>
              <ScoreControl label={P(game.team_b_player1).name + ' & ' + P(game.team_b_player2).name} value={editB} onChange={setEditB} />
            </div>
            {editError && <div style={{ background: 'var(--red-dim)', color: 'var(--red)', padding: '8px', borderRadius: '8px', fontSize: '12px', textAlign: 'center', marginBottom: '8px' }}>{editError}</div>}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => handleEditSave(game)} style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'var(--gold)', border: 'none', color: '#111', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Save</button>
              <button onClick={() => setEditingGame(null)} style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
            </div>
          </div>
        )}
        {isPending && isAdmin && <button onClick={() => setConfirmDelete(game)} style={{ width: '100%', marginTop: '10px', padding: '8px', borderRadius: '8px', background: 'var(--red-dim)', border: '1px solid var(--red)', color: 'var(--red)', fontSize: '11px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>{'\u{1F5D1}\u{FE0F}'} Remove</button>}

        {/* Score input */}
        {isActive && isCurrent && (
          <div style={{ marginTop: '16px' }}>
            <ScoreControl label={P(game.team_a_player1).name + ' & ' + P(game.team_a_player2).name} value={scoreA} onChange={setScoreA} />
            <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: 800, color: 'var(--muted)', margin: '8px 0' }}>VS</div>
            <ScoreControl label={P(game.team_b_player1).name + ' & ' + P(game.team_b_player2).name} value={scoreB} onChange={setScoreB} />
            {scoreError && <div style={{ background: 'var(--red-dim)', color: 'var(--red)', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, textAlign: 'center', margin: '12px 0' }}>{scoreError}</div>}
            <button onClick={handleSubmitScore} disabled={submitting} style={{ width: '100%', padding: '16px', minHeight: '56px', borderRadius: '12px', marginTop: '12px', background: submitting ? 'var(--surface2)' : 'var(--gold)', border: 'none', color: '#111', fontWeight: 700, fontSize: '16px', cursor: submitting ? 'wait' : 'pointer', fontFamily: "'DM Sans', sans-serif" }}>{submitting ? 'Submitting...' : 'Submit Score'}</button>
          </div>
        )}
      </div>
    )
  }

  const selStyle = { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: '13px', outline: 'none', fontFamily: "'DM Sans', sans-serif", marginBottom: '8px', WebkitAppearance: 'none' }

  return (
    <div className="screen" style={{ padding: '20px 16px 90px' }}>
      <Header />
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px', fontWeight: 300, marginBottom: '20px' }}>Schedule</div>

      {swapMsg && <div style={{ background: 'var(--green-dim)', color: 'var(--green)', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, textAlign: 'center', marginBottom: '12px' }}>{swapMsg}</div>}

      {currentGame && <GameCard game={currentGame} isCurrent={true} />}

      {/* Swap button — anyone can use */}
      {activeGame && sittingOutPlayers.length > 0 && (
        <>
          <button onClick={() => { setShowSwap(!showSwap); setSwapOut(''); setSwapIn('') }} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", marginBottom: '10px' }}>
            {showSwap ? 'Cancel Swap' : '\u{21D4} Swap Player'}
          </button>
          {showSwap && (
            <div style={{ background: 'var(--surface)', borderRadius: '14px', border: '1px solid var(--border)', padding: '16px', marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>Substitute a player</div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px', fontWeight: 600 }}>Remove from game</div>
              <select value={swapOut} onChange={e => setSwapOut(e.target.value)} style={selStyle}>
                <option value="">Select player to remove...</option>
                {currentFourIds.map(id => <option key={id} value={id}>{P(id).name}</option>)}
              </select>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px', fontWeight: 600 }}>Bring in</div>
              <select value={swapIn} onChange={e => setSwapIn(e.target.value)} style={selStyle}>
                <option value="">Select replacement...</option>
                {sittingOutPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button onClick={handleSwap} disabled={!swapOut || !swapIn} style={{ width: '100%', padding: '14px', borderRadius: '10px', background: swapOut && swapIn ? 'var(--gold)' : 'var(--surface2)', border: 'none', color: swapOut && swapIn ? '#111' : 'var(--muted)', fontWeight: 600, fontSize: '14px', cursor: swapOut && swapIn ? 'pointer' : 'not-allowed', fontFamily: "'DM Sans', sans-serif" }}>Confirm Swap</button>
            </div>
          )}
        </>
      )}

      {upcomingPending.length > 0 && (
        <>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', margin: '20px 0 10px', fontWeight: 600 }}>Upcoming</div>
          {upcomingPending.map(g => <GameCard key={g.id} game={g} isCurrent={false} />)}
        </>
      )}

      <PinGate fallback={null}>
        {pending.length > 0 && <button onClick={handleRegenerate} style={{ width: '100%', padding: '12px', marginTop: '8px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--muted)', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Regenerate Schedule</button>}
      </PinGate>

      {completed.length > 0 && (
        <>
          <button onClick={() => setShowCompleted(!showCompleted)} style={{ width: '100%', padding: '12px', marginTop: '16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Completed ({completed.length})</span><span>{showCompleted ? '\u25B2' : '\u25BC'}</span>
          </button>
          {showCompleted && completed.map(g => <GameCard key={g.id} game={g} isCurrent={false} />)}
        </>
      )}

      {confirmDelete && (
        <div onClick={() => setConfirmDelete(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '16px' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', padding: '24px', maxWidth: '300px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>{confirmDelete.status === 'completed' ? `Delete Game ${confirmDelete.game_number} results?` : `Remove Game ${confirmDelete.game_number}?`}</div>
            <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '20px' }}>{confirmDelete.status === 'completed' ? 'Player stats for this game will be reversed.' : 'This game will be removed.'}</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => handleDeleteGame(confirmDelete)} style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'var(--red)', border: 'none', color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Delete</button>
              <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
