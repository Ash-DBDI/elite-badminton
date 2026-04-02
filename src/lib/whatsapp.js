export function shareGameResult({ teamA, teamB, scoreA, scoreB, gameNumber, sessionDate }) {
  const wonA = scoreA > scoreB
  const msg = [
    `\u{1F3F8} *Elite Badminton Social*`, ``,
    `*Game ${gameNumber} Result*`, ``,
    `${wonA ? '\u{1F3C6} ' : ''}${teamA.join(' & ')}   ${scoreA} \u2013 ${scoreB}   ${!wonA ? '\u{1F3C6} ' : ''}${teamB.join(' & ')}`,
    ``, `\u{1F4C5} ${sessionDate}`, ``, `_elitebadminton.netlify.app_`
  ].join('\n')
  openWhatsApp(msg)
}

export function shareSessionSummary({ games, players, potdName, potdStats, badges, sessionDate }) {
  const results = games
    .filter(g => g.status === 'completed')
    .sort((a, b) => a.game_number - b.game_number)
    .map(g => {
      const wonA = g.team_a_score > g.team_b_score
      const tA = [getName(players, g.team_a_player1), getName(players, g.team_a_player2)].filter(Boolean).join(' & ')
      const tB = [getName(players, g.team_b_player1), getName(players, g.team_b_player2)].filter(Boolean).join(' & ')
      return `Game ${g.game_number}: ${wonA ? '\u{1F3C6}' : ''}${tA}  ${g.team_a_score}\u2013${g.team_b_score}  ${!wonA ? '\u{1F3C6}' : ''}${tB}`
    })
  const earnedBadges = badges.length > 0
    ? '\n\u{1F3C5} *Badges Earned*\n' + badges.map(b => `${b.icon} ${getName(players, b.player_id)} \u2014 ${b.label}`).join('\n')
    : ''
  const msg = [
    `\u{1F3F8} *Elite Badminton Social*`, `Session Wrap \u2014 ${sessionDate}`, ``,
    `\u{1F451} *Player of the Day: ${potdName}*`, `   ${potdStats}`, ``,
    `\u{1F4CA} *Results*`, ...results, earnedBadges, ``, `_elitebadminton.netlify.app_`
  ].join('\n')
  openWhatsApp(msg)
}

export function shareLeaderboard({ players, period }) {
  const lines = players.slice(0, 8).map((p, i) => {
    const medal = i === 0 ? '\u{1F451}' : i === 1 ? '\u{1F948}' : i === 2 ? '\u{1F949}' : `${i + 1}.`
    const rate = p.total_games > 0 ? Math.round((p.total_wins / p.total_games) * 100) : 0
    return `${medal} ${p.name.padEnd(12)} ${p.total_wins}W \u00B7 ${rate}%`
  })
  const msg = [`\u{1F3C6} *Elite Badminton Social*`, `${period} Standings`, ``, ...lines, ``, `_elitebadminton.netlify.app_`].join('\n')
  openWhatsApp(msg)
}

export function sharePlayerStats(player) {
  const rate = player.total_games > 0 ? Math.round((player.total_wins / player.total_games) * 100) : 0
  const diff = player.total_points_scored - player.total_points_conceded
  const msg = [
    `\u{1F3F8} *Elite Badminton Social*`, ``,
    `\u{1F4CA} *${player.name} \u2014 Career Stats*`, ``,
    `\u{1F3AE} ${player.total_games} games played`,
    `\u{1F3C6} ${player.total_wins}W \u00B7 ${player.total_losses}L \u00B7 ${rate}% win rate`,
    `\u{1F4C8} ${diff > 0 ? '+' : ''}${diff} pts differential`,
    `\u{1F525} Current streak: ${player.current_streak} wins`,
    ``, `_elitebadminton.netlify.app_`
  ].join('\n')
  openWhatsApp(msg)
}

function openWhatsApp(msg) {
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
}

function getName(players, id) {
  return players.find(p => p.id === id)?.name || ''
}
