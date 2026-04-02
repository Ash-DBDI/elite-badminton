import { teamRating, balance } from './elo.js'

export function makeGame(players, history = [], gameNumber = 1) {
  if (players.length < 4) return null

  const sorted = [...players].sort((a, b) => {
    const gDiff = (a.session_games || 0) - (b.session_games || 0)
    if (gDiff !== 0) return gDiff
    return (a.session_wins || 0) - (b.session_wins || 0)
  })

  const pool = sorted.slice(0, 4)
  const sittingOut = sorted.slice(4).map(p => p.id)

  const combos = [
    { a: [pool[0], pool[1]], b: [pool[2], pool[3]] },
    { a: [pool[0], pool[2]], b: [pool[1], pool[3]] },
    { a: [pool[0], pool[3]], b: [pool[1], pool[2]] },
  ]

  const scored = combos.map(c => {
    const rA = teamRating(c.a[0].skill_rating, c.a[1].skill_rating)
    const rB = teamRating(c.b[0].skill_rating, c.b[1].skill_rating)
    const bal = balance(rA, rB)
    const nov = novelty(c.a, c.b, history)
    return { ...c, score: bal * 0.65 + nov * 0.35, bal }
  })

  scored.sort((a, b) => b.score - a.score)
  const best = scored[0]

  return {
    game_number: gameNumber,
    status: 'pending',
    team_a_player1: best.a[0].id,
    team_a_player2: best.a[1].id,
    team_b_player1: best.b[0].id,
    team_b_player2: best.b[1].id,
    sitting_out: sittingOut,
    balance_score: best.bal
  }
}

function novelty(teamA, teamB, history) {
  let repeats = 0
  const aIds = teamA.map(p => p.id).sort().join()
  const bIds = teamB.map(p => p.id).sort().join()
  for (const g of history) {
    const gA = [g.team_a_player1, g.team_a_player2].sort().join()
    const gB = [g.team_b_player1, g.team_b_player2].sort().join()
    if (gA === aIds || gB === aIds || gA === bIds || gB === bIds) repeats++
  }
  return Math.max(0, 100 - repeats * 30)
}

export function buildSchedule(players, totalMinutes = 120, minsPerGame = 12) {
  const count = Math.floor(totalMinutes / minsPerGame)
  const games = []
  const stats = players.map(p => ({ ...p, session_games: 0, session_wins: 0 }))

  for (let i = 0; i < count; i++) {
    const g = makeGame(stats, games, i + 1)
    if (!g) break
    games.push(g)
    ;[g.team_a_player1, g.team_a_player2, g.team_b_player1, g.team_b_player2]
      .filter(Boolean)
      .forEach(id => {
        const p = stats.find(s => s.id === id)
        if (p) p.session_games++
      })
  }
  return games
}

export function reshuffleRemaining(players, completedGames, pendingCount, nextGameNumber) {
  const games = []
  const stats = players.map(p => {
    const wins = completedGames.filter(g => {
      const inA = [g.team_a_player1, g.team_a_player2].includes(p.id)
      const wonA = g.team_a_score > g.team_b_score
      return (inA && wonA) || (!inA && !wonA && [g.team_b_player1, g.team_b_player2].includes(p.id))
    }).length
    const played = completedGames.filter(g =>
      [g.team_a_player1, g.team_a_player2, g.team_b_player1, g.team_b_player2].includes(p.id)
    ).length
    return { ...p, session_games: played, session_wins: wins }
  })

  for (let i = 0; i < pendingCount; i++) {
    const g = makeGame(stats, [...completedGames, ...games], nextGameNumber + i)
    if (!g) break
    games.push(g)
    ;[g.team_a_player1, g.team_a_player2, g.team_b_player1, g.team_b_player2]
      .filter(Boolean)
      .forEach(id => {
        const p = stats.find(s => s.id === id)
        if (p) p.session_games++
      })
  }
  return games
}
