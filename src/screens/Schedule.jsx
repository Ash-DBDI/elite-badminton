import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'
import { expectedScore, updatedRating, teamRating } from '../lib/elo'
import { reshuffleRemaining } from '../lib/pairing'
import Avatar from '../components/Avatar'
import PinGate from '../components/PinGate'

export default function Schedule() {
  const { activeSession, loadActiveSession, players, loadPlayers } = useApp()
  const [scoreA, setScoreA] = useState(0)
  const [scoreB, setScoreB] = useState(0)
  const [showCompleted, setShowCompleted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [scoreError, setScoreError] = useState('')

  useEffect(() => {
    loadActiveSession()
  }, [])

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

  async function handleSubmitScore() {
    if (!currentGame || submitting) return
    setScoreError('')
    const a = scoreA, b = scoreB
    if (a === b) { setScoreError('Scores cannot be tied'); return }
    const winner = Math.max(a, b)
    const loser = Math.min(a, b)
    if (winner < 21) { setScoreError('Winner must have at least 21 points'); return }
    if (loser >= winner) { setScoreError('Loser must have fewer points than winner'); return }

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

      // 4. Reshuffle: delete all pending games, regenerate, then activate the first one
      const updatedCompleted = [...completed, { ...currentGame, team_a_score: a, team_b_score: b }]

      // Delete all pending games for this session
      await supabase.from('games').delete().eq('session_id', activeSession.id).eq('status', 'pending')

      // Reload session_players to get fresh stats after our updates above
      const { data: freshSp } = await supabase
        .from('session_players').select('*, players(*)').eq('session_id', activeSession.id)
      const activePlayers = (freshSp || []).filter(s => s.checked_in).map(s => s.players).filter(Boolean)

      if (activePlayers.length >= 4) {
        const nextNum = currentGame.game_number + 1
        const totalMins = activeSession.duration_minutes || 120
        const minsPerGame = 12
        const pendingCount = Math.max(0, Math.floor(totalMins / minsPerGame) - updatedCompleted.length)

        if (pendingCount > 0) {
          const reshuffled = reshuffleRemaining(activePlayers, updatedCompleted, pendingCount, nextNum)
          if (reshuffled.length > 0) {
            const rows = reshuffled.map((g, i) => ({
              session_id: activeSession.id,
              game_number: g.game_number,
              status: i === 0 ? 'active' : 'pending',
              team_a_player1: g.team_a_player1,
              team_a_player2: g.team_a_player2,
              team_b_player1: g.team_b_player1,
              team_b_player2: g.team_b_player2,
              sitting_out: g.sitting_out,
              balance_score: g.balance_score
            }))
            await supabase.from('games').insert(rows)
          }
        }
      }

      // 6. Check badges
      const winners = teamAWon
        ? [currentGame.team_a_player1, currentGame.team_a_player2]
        : [currentGame.team_b_player1, currentGame.team_b_player2]
      const winScore = teamAWon ? a : b
      const loseScore = teamAWon ? b : a

      if (winScore === 21 && loseScore <= 9) {
        for (const pid of winners) {
          await supabase.from('badges').insert({ player_id: pid, session_id: activeSession.id, badge_type: 'LIGHTNING' })
        }
      }

      if (currentGame.game_number === 1) {
        for (const pid of winners) {
          await supabase.from('badges').insert({ player_id: pid, session_id: activeSession.id, badge_type: 'FIRST_BLOOD' })
        }
      }

      // HOT_HAND check
      const allCompleted = [...updatedCompleted].sort((x, y) => x.game_number - y.game_number)
      for (const pid of fourIds) {
        const playerGames = allCompleted.filter(g =>
          [g.team_a_player1, g.team_a_player2, g.team_b_player1, g.team_b_player2].includes(pid)
        )
        let streak = 0
        for (const g of playerGames) {
          const inTeamA = [g.team_a_player1, g.team_a_player2].includes(pid)
          const w = inTeamA ? g.team_a_score > g.team_b_score : g.team_b_score > g.team_a_score
          if (w) streak++; else streak = 0
        }
        if (streak >= 3) {
          const { data: existing } = await supabase.from('badges')
            .select('id').eq('player_id', pid).eq('session_id', activeSession.id).eq('badge_type', 'HOT_HAND')
          if (!existing?.length) {
            await supabase.from('badges').insert({ player_id: pid, session_id: activeSession.id, badge_type: 'HOT_HAND' })
          }
        }
      }

      setScoreA(0)
      setScoreB(0)
      setScoreError('')
      await loadActiveSession()
      await loadPlayers()
    } catch (err) {
      console.error(err)
      setScoreError('Error submitting score. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRegenerate() {
    const activePlayers = spList.filter(s => s.checked_in).map(s => s.players).filter(Boolean)
    if (activePlayers.length < 4) return alert('Need at least 4 checked-in players')
    const pendingGames = games.filter(g => g.status === 'pending').sort((a2, b2) => a2.game_number - b2.game_number)
    if (pendingGames.length === 0) return
    const nextNum = pendingGames[0].game_number
    const reshuffled = reshuffleRemaining(activePlayers, completed, pendingGames.length, nextNum)
    for (let i = 0; i < pendingGames.length && i < reshuffled.length; i++) {
      await supabase.from('games').update({
        team_a_player1: reshuffled[i].team_a_player1,
        team_a_player2: reshuffled[i].team_a_player2,
        team_b_player1: reshuffled[i].team_b_player1,
        team_b_player2: reshuffled[i].team_b_player2,
        sitting_out: reshuffled[i].sitting_out,
        balance_score: reshuffled[i].balance_score
      }).eq('id', pendingGames[i].id)
    }
    await loadActiveSession()
  }

  function GameCard({ game, isCurrent }) {
    const isActive = game.status === 'active'
    const isDone = game.status === 'completed'
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
          {isActive && (
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--green)', background: 'var(--green-dim)', padding: '3px 10px', borderRadius: '8px' }}>
              NOW PLAYING
            </span>
          )}
          {!isActive && !isDone && (
            <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--muted)' }}>Up next</span>
          )}
          {isDone && (
            <span style={{ fontSize: '10px', color: 'var(--muted)' }}>{'\u{1F512}'} Locked</span>
          )}
        </div>

        {/* Matchup */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Team A */}
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
            {isDone && (
              <div style={{
                fontSize: '28px', fontWeight: 800, marginTop: '6px',
                color: game.team_a_score > game.team_b_score ? 'var(--gold)' : 'var(--muted)'
              }}>{game.team_a_score}</div>
            )}
          </div>

          {/* VS */}
          <div style={{ textAlign: 'center', minWidth: '60px' }}>
            <div style={{ fontSize: isCurrent ? '16px' : '12px', fontWeight: 800, color: 'var(--muted)', marginBottom: '4px' }}>VS</div>
            <div style={{
              fontSize: '10px', fontWeight: 600, color: 'var(--green)',
              background: 'var(--green-dim)', padding: '2px 8px', borderRadius: '8px'
            }}>
              {'\u{26A1}'} {game.balance_score}%
            </div>
          </div>

          {/* Team B */}
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
            {isDone && (
              <div style={{
                fontSize: '28px', fontWeight: 800, marginTop: '6px',
                color: game.team_b_score > game.team_a_score ? 'var(--gold)' : 'var(--muted)'
              }}>{game.team_b_score}</div>
            )}
          </div>
        </div>

        {/* Sitting out */}
        {game.sitting_out?.length > 0 && (
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '10px', textAlign: 'center' }}>
            Sitting out: {game.sitting_out.map(id => P(id).name).join(', ')}
          </div>
        )}

        {/* Score input for active game */}
        {isActive && isCurrent && (
          <div style={{ marginTop: '16px' }}>
            {/* Team A score */}
            <div style={{ textAlign: 'center', marginBottom: '6px' }}>
              <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                {P(game.team_a_player1).name} & {P(game.team_a_player2).name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                <button onClick={() => setScoreA(Math.max(0, scoreA - 1))} style={{
                  width: '56px', height: '56px', borderRadius: '14px',
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  color: 'var(--text)', fontSize: '24px', fontWeight: 700,
                  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>{'\uFF0D'}</button>
                <div style={{
                  width: '80px', fontSize: '48px', fontWeight: 800,
                  color: 'var(--text)', textAlign: 'center',
                  fontFamily: "'DM Sans', sans-serif", lineHeight: 1
                }}>{scoreA}</div>
                <button onClick={() => setScoreA(Math.min(30, scoreA + 1))} style={{
                  width: '56px', height: '56px', borderRadius: '14px',
                  background: 'var(--gold-dim)', border: '1px solid var(--gold-border)',
                  color: 'var(--gold)', fontSize: '24px', fontWeight: 700,
                  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>{'\uFF0B'}</button>
              </div>
            </div>

            <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: 800, color: 'var(--muted)', margin: '10px 0' }}>VS</div>

            {/* Team B score */}
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                {P(game.team_b_player1).name} & {P(game.team_b_player2).name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                <button onClick={() => setScoreB(Math.max(0, scoreB - 1))} style={{
                  width: '56px', height: '56px', borderRadius: '14px',
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  color: 'var(--text)', fontSize: '24px', fontWeight: 700,
                  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>{'\uFF0D'}</button>
                <div style={{
                  width: '80px', fontSize: '48px', fontWeight: 800,
                  color: 'var(--text)', textAlign: 'center',
                  fontFamily: "'DM Sans', sans-serif", lineHeight: 1
                }}>{scoreB}</div>
                <button onClick={() => setScoreB(Math.min(30, scoreB + 1))} style={{
                  width: '56px', height: '56px', borderRadius: '14px',
                  background: 'var(--gold-dim)', border: '1px solid var(--gold-border)',
                  color: 'var(--gold)', fontSize: '24px', fontWeight: 700,
                  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>{'\uFF0B'}</button>
              </div>
            </div>

            {/* Error message */}
            {scoreError && (
              <div style={{
                background: 'var(--red-dim)', color: 'var(--red)',
                padding: '10px 14px', borderRadius: '10px',
                fontSize: '13px', fontWeight: 500, textAlign: 'center',
                marginBottom: '12px'
              }}>{scoreError}</div>
            )}

            {/* Submit button */}
            <button onClick={handleSubmitScore} disabled={submitting} style={{
              width: '100%', padding: '18px', minHeight: '56px', borderRadius: '14px',
              background: submitting ? 'var(--surface2)' : 'var(--gold)',
              border: 'none', color: '#111', fontWeight: 800, fontSize: '16px',
              cursor: submitting ? 'wait' : 'pointer', fontFamily: "'DM Sans', sans-serif",
              letterSpacing: '0.02em'
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
      <div style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: '24px', fontWeight: 300, marginBottom: '20px'
      }}>Schedule</div>

      {/* Current game */}
      {currentGame && <GameCard game={currentGame} isCurrent={true} />}

      {/* Upcoming */}
      {upcomingPending.length > 0 && (
        <>
          <div style={{
            fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em',
            color: 'var(--muted)', margin: '20px 0 10px', fontWeight: 600
          }}>Upcoming</div>
          {upcomingPending.map(g => <GameCard key={g.id} game={g} isCurrent={false} />)}
        </>
      )}

      {/* Admin regenerate */}
      <PinGate fallback={null}>
        {pending.length > 0 && (
          <button onClick={handleRegenerate} style={{
            width: '100%', padding: '12px', marginTop: '8px',
            borderRadius: '12px', border: '1px solid var(--border)',
            background: 'var(--surface2)', color: 'var(--muted)',
            fontSize: '12px', fontWeight: 500, cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif"
          }}>
            Regenerate Schedule
          </button>
        )}
      </PinGate>

      {/* Completed games */}
      {completed.length > 0 && (
        <>
          <button onClick={() => setShowCompleted(!showCompleted)} style={{
            width: '100%', padding: '12px', marginTop: '16px',
            borderRadius: '12px', border: '1px solid var(--border)',
            background: 'var(--surface)', color: 'var(--text)',
            fontSize: '13px', fontWeight: 500, cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span>Completed ({completed.length})</span>
            <span>{showCompleted ? '\u25B2' : '\u25BC'}</span>
          </button>
          {showCompleted && completed.map(g => <GameCard key={g.id} game={g} isCurrent={false} />)}
        </>
      )}
    </div>
  )
}
