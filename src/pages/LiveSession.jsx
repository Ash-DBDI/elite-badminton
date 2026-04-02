import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../context/SessionContext'
import { generateNextGame } from '../lib/pairingEngine'
import { evaluateBadgesAfterGame } from '../lib/badgeEngine'
import { expectedScore, newRating, calculateTeamRating } from '../lib/eloEngine'
import { shareGameResult } from '../lib/whatsapp'
import Avatar from '../components/Avatar'
import ArrivalBanner from '../components/ArrivalBanner'
import WhatsAppButton from '../components/WhatsAppButton'

export default function LiveSession() {
  const navigate = useNavigate()
  const {
    activeSession, sessionPlayers, games, players,
    addGame, submitScore, saveBadges, updatePlayerStats,
    fetchActiveSession, loading
  } = useSession()

  const [scoreA, setScoreA] = useState('')
  const [scoreB, setScoreB] = useState('')
  const [arrivedPlayer, setArrivedPlayer] = useState(null)

  useEffect(() => {
    if (!loading && !activeSession) navigate('/session')
    if (activeSession?.status === 'completed') navigate('/session-end')
  }, [activeSession, loading, navigate])

  if (loading || !activeSession) return <div className="page-loading">Loading...</div>

  const herePlayers = sessionPlayers
    .filter(sp => sp.status === 'here')
    .map(sp => {
      const player = players.find(p => p.id === sp.player_id)
      return player ? { ...player, ...sp, player_id: sp.player_id } : null
    })
    .filter(Boolean)

  const currentGame = games.find(g => g.status === 'live' || g.status === 'pending')
  const completedGames = games.filter(g => g.status === 'completed')

  const getPlayer = (id) => players.find(p => p.id === id)

  const handleGenerateGame = async () => {
    const activePlayers = herePlayers.map(p => ({
      ...p,
      games_played: games.filter(g =>
        g.status === 'completed' &&
        [g.team_a_player1, g.team_a_player2, g.team_b_player1, g.team_b_player2].includes(p.id)
      ).length
    }))
    const gameNumber = completedGames.length + 1
    const game = generateNextGame(activePlayers, completedGames, gameNumber)
    if (!game) {
      alert('Not enough players for a game')
      return
    }
    await addGame(activeSession.id, { ...game, status: 'live' })
  }

  const handleSubmitScore = async () => {
    if (!currentGame) return
    const a = parseInt(scoreA)
    const b = parseInt(scoreB)
    if (isNaN(a) || isNaN(b) || a < 0 || b < 0) {
      alert('Enter valid scores')
      return
    }

    await submitScore(currentGame.id, a, b)

    const teamAWon = a > b
    const p1a = getPlayer(currentGame.team_a_player1)
    const p2a = getPlayer(currentGame.team_a_player2)
    const p1b = getPlayer(currentGame.team_b_player1)
    const p2b = getPlayer(currentGame.team_b_player2)

    if (p1a && p2a && p1b && p2b) {
      const teamARating = calculateTeamRating(p1a.skill_rating, p2a.skill_rating)
      const teamBRating = calculateTeamRating(p1b.skill_rating, p2b.skill_rating)
      const expA = expectedScore(teamARating, teamBRating)
      const expB = 1 - expA

      const updatePlayer = async (player, isTeamA) => {
        const won = isTeamA ? teamAWon : !teamAWon
        const pointsFor = isTeamA ? a : b
        const pointsAgainst = isTeamA ? b : a
        const exp = isTeamA ? expA : expB
        const newStreak = won ? player.current_streak + 1 : 0
        await updatePlayerStats(player.id, {
          skill_rating: newRating(player.skill_rating, exp, won ? 1 : 0),
          total_games: player.total_games + 1,
          total_wins: player.total_wins + (won ? 1 : 0),
          total_losses: player.total_losses + (won ? 0 : 1),
          total_points_scored: player.total_points_scored + pointsFor,
          total_points_conceded: player.total_points_conceded + pointsAgainst,
          current_streak: newStreak,
          best_streak: Math.max(player.best_streak, newStreak),
        })
      }

      await updatePlayer(p1a, true)
      await updatePlayer(p2a, true)
      await updatePlayer(p1b, false)
      await updatePlayer(p2b, false)

      const updatedGame = { ...currentGame, team_a_score: a, team_b_score: b, status: 'completed' }
      const allGames = [...completedGames, updatedGame]
      const badges = evaluateBadgesAfterGame(updatedGame, allGames, sessionPlayers, activeSession.id)
      if (badges.length > 0) await saveBadges(badges)
    }

    setScoreA('')
    setScoreB('')
  }

  const handleEndSession = () => {
    navigate('/session-end')
  }

  const handleShareGame = (game) => {
    const p1a = getPlayer(game.team_a_player1)
    const p2a = getPlayer(game.team_a_player2)
    const p1b = getPlayer(game.team_b_player1)
    const p2b = getPlayer(game.team_b_player2)
    shareGameResult({
      teamA: [p1a?.name, p2a?.name].filter(Boolean),
      teamB: [p1b?.name, p2b?.name].filter(Boolean),
      scoreA: game.team_a_score,
      scoreB: game.team_b_score,
      gameNumber: game.game_number,
      sessionDate: new Date(activeSession.date).toLocaleDateString(),
    })
  }

  return (
    <div className="page">
      {arrivedPlayer && <ArrivalBanner playerName={arrivedPlayer} />}

      <div className="session-info-bar">
        <span>Game {completedGames.length + 1}</span>
        <span>{herePlayers.length} players</span>
        <span>{activeSession.duration_minutes}min session</span>
      </div>

      {currentGame ? (
        <div className="card game-card">
          <h3 className="game-title">Game {currentGame.game_number}</h3>
          <div className="matchup">
            <div className="team team-a">
              <h4>Team A</h4>
              <div className="team-players">
                {[currentGame.team_a_player1, currentGame.team_a_player2].map(id => {
                  const p = getPlayer(id)
                  return p ? (
                    <div key={id} className="team-player">
                      <Avatar initials={p.initials} color={p.color} size={32} />
                      <span>{p.name}</span>
                    </div>
                  ) : null
                })}
              </div>
              <input
                type="number"
                className="score-input"
                value={scoreA}
                onChange={e => setScoreA(e.target.value)}
                placeholder="0"
                min="0"
                max="30"
              />
            </div>

            <div className="vs-divider">
              <span>VS</span>
              <div className="comp-score">
                {currentGame.competitiveness_score}% match
              </div>
            </div>

            <div className="team team-b">
              <h4>Team B</h4>
              <div className="team-players">
                {[currentGame.team_b_player1, currentGame.team_b_player2].map(id => {
                  const p = getPlayer(id)
                  return p ? (
                    <div key={id} className="team-player">
                      <Avatar initials={p.initials} color={p.color} size={32} />
                      <span>{p.name}</span>
                    </div>
                  ) : null
                })}
              </div>
              <input
                type="number"
                className="score-input"
                value={scoreB}
                onChange={e => setScoreB(e.target.value)}
                placeholder="0"
                min="0"
                max="30"
              />
            </div>
          </div>

          {currentGame.sitting_out?.length > 0 && (
            <div className="sitting-out">
              Sitting out: {currentGame.sitting_out.map(id => getPlayer(id)?.name).filter(Boolean).join(', ')}
            </div>
          )}

          <button className="btn btn-primary btn-lg" onClick={handleSubmitScore}>
            Submit Score
          </button>
        </div>
      ) : (
        <div className="card">
          <button className="btn btn-primary btn-lg" onClick={handleGenerateGame}>
            Generate Next Game
          </button>
        </div>
      )}

      {completedGames.length > 0 && (
        <div className="card">
          <h3 className="card-title">Completed Games</h3>
          {[...completedGames].reverse().map(game => {
            const wonA = game.team_a_score > game.team_b_score
            return (
              <div key={game.id} className="completed-game">
                <div className="game-result">
                  <div className={`result-team ${wonA ? 'winner' : ''}`}>
                    {[game.team_a_player1, game.team_a_player2].map(id => getPlayer(id)?.name).filter(Boolean).join(' & ')}
                  </div>
                  <div className="result-score">
                    <span className={wonA ? 'winner' : ''}>{game.team_a_score}</span>
                    <span className="score-dash">-</span>
                    <span className={!wonA ? 'winner' : ''}>{game.team_b_score}</span>
                  </div>
                  <div className={`result-team ${!wonA ? 'winner' : ''}`}>
                    {[game.team_b_player1, game.team_b_player2].map(id => getPlayer(id)?.name).filter(Boolean).join(' & ')}
                  </div>
                </div>
                <WhatsAppButton onClick={() => handleShareGame(game)} label="Share" />
              </div>
            )
          })}
        </div>
      )}

      <div className="card">
        <button className="btn btn-danger btn-lg" onClick={handleEndSession}>
          End Session
        </button>
      </div>
    </div>
  )
}
