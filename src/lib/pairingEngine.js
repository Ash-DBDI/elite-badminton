import { calculateTeamRating, competitivenessScore } from './eloEngine.js'

export function generateNextGame(activePlayers, existingGames = [], gameNumber = 1) {
  if (activePlayers.length < 4) return null
  const result = selectFourPlayers(activePlayers, existingGames)
  if (!result) return null
  const { teamA, teamB, sittingOut } = result
  const teamARating = calculateTeamRating(teamA[0].skill_rating, teamA[1].skill_rating)
  const teamBRating = calculateTeamRating(teamB[0].skill_rating, teamB[1].skill_rating)
  return {
    game_number: gameNumber,
    team_a_player1: teamA[0].id,
    team_a_player2: teamA[1].id,
    team_b_player1: teamB[0].id,
    team_b_player2: teamB[1].id,
    sitting_out: sittingOut.map(p => p.id),
    competitiveness_score: competitivenessScore(teamARating, teamBRating),
    status: 'pending'
  }
}

function selectFourPlayers(players, existingGames) {
  const sorted = [...players].sort((a, b) => {
    if (a.games_played !== b.games_played) return a.games_played - b.games_played
    return (a.session_wins || 0) - (b.session_wins || 0)
  })
  const playing = sorted.slice(0, 4)
  const sittingOut = sorted.slice(4)
  const pairs = [
    { teamA: [playing[0], playing[1]], teamB: [playing[2], playing[3]] },
    { teamA: [playing[0], playing[2]], teamB: [playing[1], playing[3]] },
    { teamA: [playing[0], playing[3]], teamB: [playing[1], playing[2]] },
  ]
  const scored = pairs.map(p => {
    const teamARating = calculateTeamRating(p.teamA[0].skill_rating, p.teamA[1].skill_rating)
    const teamBRating = calculateTeamRating(p.teamB[0].skill_rating, p.teamB[1].skill_rating)
    const comp = competitivenessScore(teamARating, teamBRating)
    const novelty = partnerNoveltyScore(p.teamA, p.teamB, existingGames)
    return { ...p, score: comp * 0.7 + novelty * 0.3 }
  })
  scored.sort((a, b) => b.score - a.score)
  return { teamA: scored[0].teamA, teamB: scored[0].teamB, sittingOut }
}

function partnerNoveltyScore(teamA, teamB, existingGames) {
  let repeats = 0
  for (const game of existingGames) {
    const aIds = [game.team_a_player1, game.team_a_player2]
    const bIds = [game.team_b_player1, game.team_b_player2]
    const tAIds = teamA.map(p => p.id)
    const tBIds = teamB.map(p => p.id)
    if (arraysMatch(aIds, tAIds) || arraysMatch(bIds, tBIds)) repeats++
    if (arraysMatch(aIds, tBIds) || arraysMatch(bIds, tAIds)) repeats++
  }
  return Math.max(0, 100 - repeats * 25)
}

function arraysMatch(a, b) {
  return a.length === b.length && [...a].sort().join() === [...b].sort().join()
}

export function generateFullSchedule(activePlayers, sessionDurationMins = 120, minsPerGame = 12) {
  const totalGames = Math.floor(sessionDurationMins / minsPerGame)
  const games = []
  const playerStats = activePlayers.map(p => ({ ...p, games_played: 0, session_wins: 0 }))
  for (let i = 0; i < totalGames; i++) {
    const game = generateNextGame(playerStats, games, i + 1)
    if (!game) break
    games.push(game)
    const playing = [game.team_a_player1, game.team_a_player2, game.team_b_player1, game.team_b_player2]
    playerStats.forEach(p => { if (playing.includes(p.id)) p.games_played++ })
  }
  return games
}
