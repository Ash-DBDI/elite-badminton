function selectPool(players, lastGame) {
  const sorted = [...players].sort((a, b) => {
    const gDiff = (a.session_games || 0) - (b.session_games || 0)
    if (gDiff !== 0) return gDiff
    return (a.session_wins || 0) - (b.session_wins || 0)
  })

  const neverPlayed = sorted.filter(p => (p.session_games || 0) === 0)

  const satOutLast = lastGame
    ? sorted.filter(p =>
        (lastGame.sitting_out || []).includes(p.id) &&
        (p.session_games || 0) > 0
      )
    : []

  const others = sorted.filter(p =>
    !neverPlayed.find(np => np.id === p.id) &&
    !satOutLast.find(so => so.id === p.id)
  )

  const orderedAll = [...neverPlayed, ...satOutLast, ...others]
  const pool = orderedAll.slice(0, 4)
  const sittingOut = orderedAll.slice(4).map(p => p.id)

  return { pool, sittingOut }
}

export function makeGame(players, history = [], gameNumber = 1, lastGame = null) {
  if (players.length < 4) return null

  const { pool, sittingOut } = selectPool(players, lastGame)

  if (pool.length < 4) return null

  const combos = [
    { a: [pool[0], pool[1]], b: [pool[2], pool[3]] },
    { a: [pool[0], pool[2]], b: [pool[1], pool[3]] },
    { a: [pool[0], pool[3]], b: [pool[1], pool[2]] },
  ]

  const scored = combos.map(c => {
    const rA = Math.round((c.a[0].skill_rating + c.a[1].skill_rating) / 2)
    const rB = Math.round((c.b[0].skill_rating + c.b[1].skill_rating) / 2)
    const diff = Math.abs(rA - rB)
    const bal = diff < 25 ? 97 : diff < 50 ? 88 : diff < 100 ? 75 : diff < 160 ? 58 : 40

    const aKey = c.a.map(p => p.id).sort().join('-')
    const bKey = c.b.map(p => p.id).sort().join('-')
    let novelty = 100
    for (const g of history) {
      const gAKey = [g.team_a_player1, g.team_a_player2].sort().join('-')
      const gBKey = [g.team_b_player1, g.team_b_player2].sort().join('-')
      if (gAKey === aKey || gBKey === aKey || gAKey === bKey || gBKey === bKey) {
        novelty -= 35
      }
    }
    novelty = Math.max(0, novelty)

    return { ...c, score: bal * 0.55 + novelty * 0.45, bal }
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

export function buildSchedule(players, totalMinutes = 120, minsPerGame = 12) {
  const count = Math.floor(totalMinutes / minsPerGame)
  const games = []
  const stats = players.map(p => ({ ...p, session_games: 0, session_wins: 0 }))

  for (let i = 0; i < count; i++) {
    const lastGame = games.length > 0 ? games[games.length - 1] : null
    const g = makeGame(stats, games, i + 1, lastGame)
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
    const myCompletedGames = completedGames.filter(g =>
      [g.team_a_player1, g.team_a_player2, g.team_b_player1, g.team_b_player2].includes(p.id)
    )
    const myWins = myCompletedGames.filter(g => {
      const inA = [g.team_a_player1, g.team_a_player2].includes(p.id)
      return inA ? g.team_a_score > g.team_b_score : g.team_b_score > g.team_a_score
    })
    return {
      ...p,
      session_games: myCompletedGames.length,
      session_wins: myWins.length
    }
  })

  const allHistory = [...completedGames]

  for (let i = 0; i < pendingCount; i++) {
    const allSoFar = [...allHistory, ...games]
    const lastGame = allSoFar.length > 0
      ? [...allSoFar].sort((a, b) => (b.game_number || 0) - (a.game_number || 0))[0]
      : null

    const g = makeGame(stats, allSoFar, nextGameNumber + i, lastGame)
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
