import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'
import { expectedScore, updatedRating, teamRating } from '../lib/elo'
import { reshuffleRemaining } from '../lib/pairing'
import Avatar from '../components/Avatar'
import PinGate from '../components/PinGate'

const inputStyle = {
  width: '80px', padding: '12px 4px', textAlign: 'center',
  fontSize: '28px', fontWeight: 800, borderRadius: '12px',
  border: '2px solid var(--border)', background: 'var(--surface2)',
  color: 'var(--text)', outline: 'none', fontFamily: "'DM Sans', sans-serif"
}

export default function Schedule() {
  const { activeSession, loadActiveSession, players, loadPlayers, isAdmin } = useApp()
  const [scoreA, setScoreA] = useState('')
  const [scoreB, setScoreB] = useState('')
  const [showCompleted, setShowCompleted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [scoreError, setScoreError] = useState('')
  const [editingGame, setEditingGame] = useState(null)
  const [editScoreA, setEditScoreA] = useState('')
  const [editScoreB, setEditScoreB] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

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

  const games = activeSession.games || []
  const completed = games.filter(g => g.status === 'completed').sort((a, b) => a.game_number - b.game_number)
  const pending = games.filter(g => g.status === 'pending').sort((a, b) => a.game_number - b.game_number)
  const activeGame = games.find(g => g.status === 'active')
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

  function validateScore(a, b) {
    if (a === '' || b === '') return 'Enter both scores'
    const na = parseInt(a), nb = parseInt(b)
    if (isNaN(na) || isNaN(nb)) return 'Enter valid numbers'
    if (na < 0 || nb < 0) return 'Scores cannot be negative'
    if (na === nb) return 'Scores cannot be tied'
    if (Math.max(na, nb) < 21) return 'Winner must have at least 21 points'
    return null
  }

  async function handleSubmitScore() {
    if (!currentGame || submitting) return
    setScoreError('')
    const err = validateScore(scoreA, scoreB)
    if (err) { setScoreError(err); return }
    const a = parseInt(scoreA), b = parseInt(scoreB)

    setSubmitting(true)
    try {
      // 1. Complete the game
      await supabase.from('games').update({
        team_a_score: a, team_b_score: b,
        status: 'completed', locked: true,
        completed_at: new Date().toISOString()
      }).eq('id', currentGame.id)

      // 2. Update session_players stats
      const teamAWon = a > b
      const fourIds = [currentGame.team_a_player1, currentGame.team_a_player2, currentGame.team_b_player1, currentGame.team_b_player2]
      for (const pid of fourIds) {
        const sp = spList.find(s => s.player_id === pid)
        if (!sp) continue
        const inA = [currentGame.team_a_player1, currentGame.team_a_player2].includes(pid)
        const won = inA ? teamAWon : !teamAWon
        const pts = inA ? a : b
        const ptsConceded = inA ? b : a
        await supabase.from('session_players').update({
          games_played: sp.games_played + 1,
          games_won: sp.games_won + (won ? 1 : 0),
          points_scored: sp.points_scored + pts,
          points_conceded: sp.points_conceded + ptsConceded
        }).eq('id', sp.id)
      }

      // 3. Update player ELO
      const rA = teamRating(P(currentGame.team_a_player1).skill_rating, P(currentGame.team_a_player2).skill_rating)
      const rB = teamRating(P(currentGame.team_b_player1).skill_rating, P(currentGame.team_b_player2).skill_rating)
      const expA = expectedScore(rA, rB)
      for (const pid of fourIds) {
        const p = P(pid)
        const inA = [currentGame.team_a_player1, currentGame.team_a_player2].includes(pid)
        const won = inA ? teamAWon : !teamAWon
        const exp = inA ? expA : 1 - expA
        const newRating = updatedRating(p.skill_rating, exp, won ? 1 : 0)
        const newStreak = won ? (p.current_streak || 0) + 1 : 0
        await supabase.from('players').update({
          skill_rating: newRating,
          total_games: (p.total_games || 0) + 1,
          total_wins: (p.total_wins || 0) + (won ? 1 : 0),
          total_losses: (p.total_losses || 0) + (won ? 0 : 1),
          total_points_scored: (p.total_points_scored || 0) + (inA ? a : b),
          total_points_conceded: (p.total_points_conceded || 0) + (inA ? b : a),
          current_streak: newStreak,
          best_streak: Math.max(p.best_streak || 0, newStreak)
        }).eq('id', pid)
      }

      // 4. Reshuffle: delete all pending, regenerate, activate first
      const updatedCompleted = [...completed, { ...currentGame, team_a_score: a, team_b_score: b }]
      await supabase.from('games').delete().eq('session_id', activeSession.id).eq('status', 'pending')

      const { data: freshSp } = await supabase
        .from('session_players').select('*, players(*)').eq('session_id', activeSession.id)
      const activePlayers = (freshSp || []).filter(s => s.checked_in).map(s => s.players).filter(Boolean)

      if (activePlayers.length >= 4) {
        const nextNum = currentGame.game_number + 1
        const totalMins = activeSession.duration_minutes || 120
        const pendingCount = Math.max(0, Math.floor(totalMins / 12) - updatedCompleted.length)
        if (pendingCount > 0) {
          const reshuffled = reshuffleRemaining(activePlayers, updatedCompleted, pendingCount, nextNum)
          if (reshuffled.length > 0) {
            const rows = reshuffled.map((g, i) => ({
              session_id: activeSession.id, game_number: g.game_number,
              status: i === 0 ? 'active' : 'pending',
              team_a_player1: g.team_a_player1, team_a_player2: g.team_a_player2,
              team_b_player1: g.team_b_player1, team_b_player2: g.team_b_player2,
              sitting_out: g.sitting_out, balance_score: g.balance_score
            }))
            await supabase.from('games').insert(rows)
          }
        }
      }

      // 5. Badges
      const winners = teamAWon
        ? [currentGame.team_a_player1, currentGame.team_a_player2]
        : [currentGame.team_b_player1, currentGame.team_b_player2]
      if ((teamAWon ? a : b) === 21 && (teamAWon ? b : a) <= 9) {
        for (const pid of winners) await supabase.from('badges').insert({ player_id: pid, session_id: activeSession.id, badge_type: 'LIGHTNING' })
      }
      if (currentGame.game_number === 1) {
        for (const pid of winners) await supabase.from('badges').insert({ player_id: pid, session_id: activeSession.id, badge_type: 'FIRST_BLOOD' })
      }
      const allCompleted = [...completed, { ...currentGame, team_a_score: a, team_b_score: b }].sort((x, y) => x.game_number - y.game_number)
      for (const pid of fourIds) {
        const playerGames = allCompleted.filter(g => [g.team_a_player1, g.team_a_player2, g.team_b_player1, g.team_b_player2].includes(pid))
        let streak = 0
        for (const g of playerGames) {
          const inTeamA = [g.team_a_player1, g.team_a_player2].includes(pid)
          if (inTeamA ? g.team_a_score > g.team_b_score : g.team_b_score > g.team_a_score) streak++; else streak = 0
        }
        if (streak >= 3) {
          const { data: existing } = await supabase.from('badges').select('id').eq('player_id', pid).eq('session_id', activeSession.id).eq('badge_type', 'HOT_HAND')
          if (!existing?.length) await supabase.from('badges').insert({ player_id: pid, session_id: activeSession.id, badge_type: 'HOT_HAND' })
        }
      }

      setScoreA(''); setScoreB(''); setScoreError('')
      await loadActiveSession()
      await loadPlayers()
    } catch (err) {
      console.error(err)
      setScoreError('Error submitting score. Please try again.')
    } finally { setSubmitting(false) }
  }

  // Admin: delete a game
  async function handleDeleteGame(game) {
    await supabase.from('games').delete().eq('id', game.id)
    setConfirmDelete(null)
    await loadActiveSession()
  }

  // Admin: update score on a completed game
  async function handleEditScore(game) {
    const err = validateScore(editScoreA, editScoreB)
    if (err) { alert(err); return }
    await supabase.from('games').update({
      team_a_score: parseInt(editScoreA),
      team_b_score: parseInt(editScoreB)
    }).eq('id', game.id)
    setEditingGame(null)
    await loadActiveSession()
  }

  async function handleRegenerate() {
    const activePlayers = spList.filter(s => s.checked_in).map(s => s.players).filter(Boolean)
    if (activePlayers.length < 4) return alert('Need at least 4 checked-in players')
    const pendingGames = games.filter(g => g.status === 'pending').sort((a2, b2) => a2.game_number - b2.game_number)
    if (pendingGames.length === 0) return
    await supabase.from('games').delete().eq('session_id', activeSession.id).eq('status', 'pending')
    const nextNum = pendingGames[0].game_number
    const reshuffled = reshuffleRemaining(activePlayers, completed, pendingGames.length, nextNum)
    if (reshuffled.length > 0) {
      const rows = reshuffled.map(g => ({
        session_id: activeSession.id, game_number: g.game_number, status: 'pending',
        team_a_player1: g.team_a_player1, team_a_player2: g.team_a_player2,
        team_b_player1: g.team_b_player1, team_b_player2: g.team_b_player2,
        sitting_out: g.sitting_out, balance_score: g.balance_score
      }))
      await supabase.from('games').insert(rows)
    }
    await loadActiveSession()
  }

  function GameCard({ game, isCurrent }) {
    const isActive = game.status === 'active'
    const isDone = game.status === 'completed'
    const isPending = game.status === 'pending'
    const isEditing = editingGame === game.id

    return (
      <div style={{
        background: 'var(--surface)', borderRadius: '16px',
        border: `1px solid ${isCurrent ? 'var(--gold-border)' : 'var(--border)'}`,
        padding: isCurrent ? '20px' : '14px 16px',
        marginBottom: '10px'
      }}>
        {/* Game header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Game {game.game_number}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isActive && (
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--green)', background: 'var(--green-dim)', padding: '3px 10px', borderRadius: '8px' }}>
                NOW PLAYING
              </span>
            )}
            {isPending && <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--muted)' }}>Up next</span>}
            {isDone && <span style={{ fontSize: '10px', color: 'var(--muted)' }}>{'\u{1F512}'} Locked</span>}

            {/* Admin controls */}
            {isAdmin && (
              <button onClick={e => { e.stopPropagation(); setConfirmDelete(game) }} style={{
                background: 'none', border: 'none', fontSize: '14px', cursor: 'pointer', opacity: 0.4, padding: '2px'
              }}>{'\u{1F5D1}\u{FE0F}'}</button>
            )}
          </div>
        </div>

        {/* Matchup */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            {[game.team_a_player1, game.team_a_player2].map(id => {
              const p = P(id)
              return (
                <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', justifyContent: 'center' }}>
                  <Avatar initials={p.initials} size={isCurrent ? 28 : 22} index={p._i} />
                  <span style={{ fontSize: isCurrent ? '13px' : '11px', fontWeight: 500 }}>{p.name}</span>
                </div>
              )
            })}
            {isDone && !isEditing && (
              <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '6px', color: game.team_a_score > game.team_b_score ? 'var(--gold)' : 'var(--muted)' }}>
                {game.team_a_score}
              </div>
            )}
          </div>

          <div style={{ textAlign: 'center', minWidth: '60px' }}>
            <div style={{ fontSize: isCurrent ? '16px' : '12px', fontWeight: 800, color: 'var(--muted)', marginBottom: '4px' }}>VS</div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--green)', background: 'var(--green-dim)', padding: '2px 8px', borderRadius: '8px' }}>
              {'\u{26A1}'} {game.balance_score}%
            </div>
          </div>

          <div style={{ flex: 1, textAlign: 'center' }}>
            {[game.team_b_player1, game.team_b_player2].map(id => {
              const p = P(id)
              return (
                <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', justifyContent: 'center' }}>
                  <Avatar initials={p.initials} size={isCurrent ? 28 : 22} index={p._i} />
                  <span style={{ fontSize: isCurrent ? '13px' : '11px', fontWeight: 500 }}>{p.name}</span>
                </div>
              )
            })}
            {isDone && !isEditing && (
              <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '6px', color: game.team_b_score > game.team_a_score ? 'var(--gold)' : 'var(--muted)' }}>
                {game.team_b_score}
              </div>
            )}
          </div>
        </div>

        {/* Sitting out */}
        {game.sitting_out?.length > 0 && (
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '10px', textAlign: 'center' }}>
            Sitting out: {game.sitting_out.map(id => P(id).name).join(', ')}
          </div>
        )}

        {/* Admin: edit score on completed game */}
        {isDone && isAdmin && !isEditing && (
          <button onClick={() => { setEditingGame(game.id); setEditScoreA(String(game.team_a_score)); setEditScoreB(String(game.team_b_score)) }}
            style={{ marginTop: '10px', background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 14px', fontSize: '11px', color: 'var(--muted)', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", width: '100%' }}>
            Edit Score
          </button>
        )}
        {isDone && isEditing && (
          <div style={{ marginTop: '12px' }}>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', alignItems: 'center', marginBottom: '10px' }}>
              <input type="number" value={editScoreA} onChange={e => setEditScoreA(e.target.value)}
                style={{ ...inputStyle, width: '70px', fontSize: '22px', padding: '10px 4px' }} />
              <span style={{ fontWeight: 800, color: 'var(--muted)' }}>{'\u2013'}</span>
              <input type="number" value={editScoreB} onChange={e => setEditScoreB(e.target.value)}
                style={{ ...inputStyle, width: '70px', fontSize: '22px', padding: '10px 4px' }} />
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => handleEditScore(game)} style={{
                flex: 1, padding: '10px', borderRadius: '10px', background: 'var(--gold)', border: 'none', color: '#111', fontWeight: 600, fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif"
              }}>Save</button>
              <button onClick={() => setEditingGame(null)} style={{
                flex: 1, padding: '10px', borderRadius: '10px', background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', fontWeight: 500, fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif"
              }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Score input for active game — typeable inputs */}
        {isActive && isCurrent && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: 'var(--muted)', marginBottom: '6px', fontWeight: 600 }}>
                  {P(game.team_a_player1).name} & {P(game.team_a_player2).name}
                </div>
                <input type="number" value={scoreA} onChange={e => setScoreA(e.target.value)}
                  placeholder="0" min="0" max="30" inputMode="numeric"
                  style={inputStyle} />
              </div>
              <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--muted)', paddingTop: '18px' }}>{'\u2013'}</span>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: 'var(--muted)', marginBottom: '6px', fontWeight: 600 }}>
                  {P(game.team_b_player1).name} & {P(game.team_b_player2).name}
                </div>
                <input type="number" value={scoreB} onChange={e => setScoreB(e.target.value)}
                  placeholder="0" min="0" max="30" inputMode="numeric"
                  style={inputStyle} />
              </div>
            </div>

            {scoreError && (
              <div style={{ background: 'var(--red-dim)', color: 'var(--red)', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, textAlign: 'center', marginBottom: '12px' }}>
                {scoreError}
              </div>
            )}

            <button onClick={handleSubmitScore} disabled={submitting} style={{
              width: '100%', padding: '16px', minHeight: '52px', borderRadius: '12px',
              background: submitting ? 'var(--surface2)' : 'var(--gold)',
              border: 'none', color: '#111', fontWeight: 700, fontSize: '15px',
              cursor: submitting ? 'wait' : 'pointer', fontFamily: "'DM Sans', sans-serif"
            }}>
              {submitting ? 'Submitting...' : 'Submit Score'}
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="screen" style={{ padding: '20px 16px 90px' }}>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px', fontWeight: 300, marginBottom: '20px' }}>
        Schedule
      </div>

      {currentGame && <GameCard game={currentGame} isCurrent={true} />}

      {upcomingPending.length > 0 && (
        <>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', margin: '20px 0 10px', fontWeight: 600 }}>
            Upcoming
          </div>
          {upcomingPending.map(g => <GameCard key={g.id} game={g} isCurrent={false} />)}
        </>
      )}

      <PinGate fallback={null}>
        {pending.length > 0 && (
          <button onClick={handleRegenerate} style={{
            width: '100%', padding: '12px', marginTop: '8px', borderRadius: '12px',
            border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--muted)',
            fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif"
          }}>
            Regenerate Schedule
          </button>
        )}
      </PinGate>

      {completed.length > 0 && (
        <>
          <button onClick={() => setShowCompleted(!showCompleted)} style={{
            width: '100%', padding: '12px', marginTop: '16px', borderRadius: '12px',
            border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)',
            fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span>Completed ({completed.length})</span>
            <span>{showCompleted ? '\u25B2' : '\u25BC'}</span>
          </button>
          {showCompleted && completed.map(g => <GameCard key={g.id} game={g} isCurrent={false} />)}
        </>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div onClick={() => setConfirmDelete(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '16px'
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)',
            padding: '24px', maxWidth: '300px', width: '100%', textAlign: 'center'
          }}>
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
              Delete Game {confirmDelete.game_number}?
            </div>
            <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '20px' }}>
              {confirmDelete.status === 'completed' ? 'This will remove the completed game result.' : 'This will remove this game from the schedule.'}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => handleDeleteGame(confirmDelete)} style={{
                flex: 1, padding: '12px', borderRadius: '10px', background: 'var(--red)', border: 'none',
                color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif"
              }}>Delete</button>
              <button onClick={() => setConfirmDelete(null)} style={{
                flex: 1, padding: '12px', borderRadius: '10px', background: 'var(--surface2)',
                border: '1px solid var(--border)', color: 'var(--text)', fontWeight: 500, fontSize: '13px',
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif"
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
