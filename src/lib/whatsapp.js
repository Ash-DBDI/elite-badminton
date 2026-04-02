export function shareGameResult({ gameNumber, teamA, teamB, scoreA, scoreB, sessionDate }) {
  const wonA = scoreA > scoreB
  const msg = [
    `\u{1F3F8} *EBS \u2014 Elite Badminton Social*`, ``,
    `*Game ${gameNumber} Result*`, ``,
    `${wonA ? '\u{1F3C6} ' : ''}*${teamA.join(' & ')}*   ${scoreA} \u2013 ${scoreB}   ${!wonA ? '\u{1F3C6} ' : ''}*${teamB.join(' & ')}*`,
    ``, `\u{1F4C5} ${sessionDate}`, ``, `_elite-badminton-theta.vercel.app_`
  ].join('\n')
  openWA(msg)
}

export function shareSessionSummary({ games, players, potdName, potdRecord, potdBadges, sessionDate, totalGames }) {
  const results = (games || [])
    .filter(g => g.status === 'completed')
    .sort((a, b) => a.game_number - b.game_number)
    .map(g => {
      const wonA = g.team_a_score > g.team_b_score
      const tA = [getName(players, g.team_a_player1), getName(players, g.team_a_player2)].filter(Boolean).join(' & ')
      const tB = [getName(players, g.team_b_player1), getName(players, g.team_b_player2)].filter(Boolean).join(' & ')
      return `Game ${g.game_number}: ${wonA ? '\u{1F3C6}' : ''}${tA}  ${g.team_a_score}\u2013${g.team_b_score}  ${!wonA ? '\u{1F3C6}' : ''}${tB}`
    })
  const badgeStr = potdBadges && potdBadges.length > 0
    ? '\n\u{1F3C5} Badges: ' + potdBadges.map(b => b.icon + ' ' + b.label).join(' \u00B7 ') : ''
  const msg = [
    `\u{1F3F8} *EBS \u2014 Elite Badminton Social*`, `Session Wrap \u00B7 ${sessionDate}`, ``,
    `\u{1F451} *Player of the Day: ${potdName}*`, `   ${potdRecord}${badgeStr}`, ``,
    `\u{1F4CA} *Results (${totalGames} games)*`, ...results, ``, `_elite-badminton-theta.vercel.app_`
  ].join('\n')
  openWA(msg)
}

export function shareLeaderboard({ players, period }) {
  const ranked = [...players].filter(p => p.total_games > 0)
    .sort((a, b) => { const ra = a.total_wins / a.total_games; const rb = b.total_wins / b.total_games; return rb - ra || b.total_wins - a.total_wins })
  const medals = ['\u{1F451}', '\u{1F948}', '\u{1F949}']
  const lines = ranked.map((p, i) => {
    const pct = p.total_games > 0 ? Math.round(p.total_wins / p.total_games * 100) : 0
    return `${medals[i] || `${i + 1}.`} ${p.name.padEnd(10)} ${p.total_wins}W \u00B7 ${p.total_losses}L \u00B7 ${pct}%`
  })
  const msg = [`\u{1F3C6} *EBS Leaderboard \u2014 ${period}*`, ``, ...lines, ``, `_elite-badminton-theta.vercel.app_`].join('\n')
  openWA(msg)
}

export function sharePlayerStats(player) {
  const pct = player.total_games > 0 ? Math.round(player.total_wins / player.total_games * 100) : 0
  const diff = player.total_points_scored - player.total_points_conceded
  const msg = [
    `\u{1F3F8} *EBS Player Stats*`, ``, `\u{1F464} *${player.name}*`, ``,
    `\u{1F3AE} ${player.total_games} games played`,
    `\u{1F3C6} ${player.total_wins}W \u00B7 ${player.total_losses}L \u00B7 ${pct}% win rate`,
    `\u{1F4C8} Points diff: ${diff > 0 ? '+' : ''}${diff}`,
    `\u{1F525} Current streak: ${player.current_streak} wins`,
    `\u{2B50} Best streak: ${player.best_streak} wins`,
    ``, `_elite-badminton-theta.vercel.app_`
  ].join('\n')
  openWA(msg)
}

function openWA(msg) { window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank') }
function getName(players, id) { return players?.find(p => p.id === id)?.name || '' }
