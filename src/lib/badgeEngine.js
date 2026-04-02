export const BADGES = {
  HOT_HAND:      { key: 'HOT_HAND',      icon: '\u{1F525}', label: 'Hot Hand',       desc: '3 wins in a row in one session' },
  COMEBACK_KING: { key: 'COMEBACK_KING', icon: '\u{1F4AA}', label: 'Comeback King',  desc: 'Won after being down big' },
  THE_WALL:      { key: 'THE_WALL',      icon: '\u{1F9F1}', label: 'The Wall',       desc: 'Fewest points conceded in a session' },
  SHARP_SHOOTER: { key: 'SHARP_SHOOTER', icon: '\u{1F3AF}', label: 'Sharp Shooter',  desc: 'Highest points scored in a game' },
  POTD:          { key: 'POTD',          icon: '\u{1F451}', label: 'Player of Day',  desc: 'Best overall performance' },
  BEST_DUO:      { key: 'BEST_DUO',      icon: '\u{1F91D}', label: 'Best Duo',       desc: 'Most wins with same partner' },
  MOST_IMPROVED: { key: 'MOST_IMPROVED', icon: '\u{1F4C8}', label: 'Most Improved',  desc: 'Biggest rating jump' },
  LIGHTNING:     { key: 'LIGHTNING',     icon: '\u{26A1}',  label: 'Lightning',      desc: 'Won 21-9 or better' },
  IRON_MAN:      { key: 'IRON_MAN',      icon: '\u{1F9BE}', label: 'Iron Man',       desc: 'Played every game in a session' },
  FIRST_BLOOD:   { key: 'FIRST_BLOOD',   icon: '\u{1FA78}', label: 'First Blood',    desc: 'Won the first game of a session' },
}

export function evaluateBadgesAfterGame(game, sessionGames, sessionPlayers, sessionId) {
  const newBadges = []
  if (!game.team_a_score || !game.team_b_score) return newBadges
  const teamAWon = game.team_a_score > game.team_b_score
  const winners = teamAWon ? [game.team_a_player1, game.team_a_player2] : [game.team_b_player1, game.team_b_player2]
  const winnerScore = teamAWon ? game.team_a_score : game.team_b_score
  const loserScore = teamAWon ? game.team_b_score : game.team_a_score

  if (winnerScore === 21 && loserScore <= 9) {
    winners.forEach(pid => newBadges.push({ player_id: pid, badge_type: 'LIGHTNING', session_id: sessionId }))
  }
  if (game.game_number === 1) {
    winners.forEach(pid => newBadges.push({ player_id: pid, badge_type: 'FIRST_BLOOD', session_id: sessionId }))
  }

  sessionPlayers.forEach(sp => {
    const pid = sp.player_id
    const playerGames = sessionGames
      .filter(g => g.status === 'completed')
      .sort((a, b) => a.game_number - b.game_number)
      .filter(g => [g.team_a_player1, g.team_a_player2, g.team_b_player1, g.team_b_player2].includes(pid))
    let streak = 0
    for (const g of playerGames) {
      const inTeamA = [g.team_a_player1, g.team_a_player2].includes(pid)
      const won = inTeamA ? g.team_a_score > g.team_b_score : g.team_b_score > g.team_a_score
      if (won) streak++
      else streak = 0
    }
    if (streak >= 3) newBadges.push({ player_id: pid, badge_type: 'HOT_HAND', session_id: sessionId })
  })

  return newBadges
}

export function evaluateBadgesAtSessionEnd(sessionGames, sessionPlayers, sessionId) {
  const newBadges = []
  const completed = sessionGames.filter(g => g.status === 'completed')
  const stats = {}
  sessionPlayers.forEach(sp => {
    stats[sp.player_id] = { pid: sp.player_id, wins: 0, losses: 0, pointsScored: 0, pointsConceded: 0, gamesPlayed: 0 }
  })
  completed.forEach(g => {
    const teamAWon = g.team_a_score > g.team_b_score
    const teamA = [g.team_a_player1, g.team_a_player2].filter(Boolean)
    const teamB = [g.team_b_player1, g.team_b_player2].filter(Boolean)
    teamA.forEach(pid => {
      if (!stats[pid]) return
      stats[pid].gamesPlayed++
      stats[pid].pointsScored += g.team_a_score || 0
      stats[pid].pointsConceded += g.team_b_score || 0
      if (teamAWon) stats[pid].wins++
      else stats[pid].losses++
    })
    teamB.forEach(pid => {
      if (!stats[pid]) return
      stats[pid].gamesPlayed++
      stats[pid].pointsScored += g.team_b_score || 0
      stats[pid].pointsConceded += g.team_a_score || 0
      if (!teamAWon) stats[pid].wins++
      else stats[pid].losses++
    })
  })
  const statList = Object.values(stats).filter(s => s.gamesPlayed > 0)

  if (statList.length > 0) {
    const minConceded = Math.min(...statList.map(s => s.pointsConceded))
    statList.filter(s => s.pointsConceded === minConceded).forEach(s =>
      newBadges.push({ player_id: s.pid, badge_type: 'THE_WALL', session_id: sessionId })
    )
  }

  const totalGames = completed.length
  statList.filter(s => s.gamesPlayed >= totalGames && totalGames >= 3).forEach(s =>
    newBadges.push({ player_id: s.pid, badge_type: 'IRON_MAN', session_id: sessionId })
  )

  const scored = statList.map(s => ({
    pid: s.pid,
    score: s.wins * 3 + (s.pointsScored - s.pointsConceded) * 0.1
  })).sort((a, b) => b.score - a.score)

  if (scored.length > 0) {
    newBadges.push({ player_id: scored[0].pid, badge_type: 'POTD', session_id: sessionId })
  }

  return { newBadges, potdPlayerId: scored?.[0]?.pid || null, stats }
}
