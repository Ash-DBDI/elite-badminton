import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../context/SessionContext'
import { evaluateBadgesAtSessionEnd, BADGES } from '../lib/badgeEngine'
import { shareSessionSummary } from '../lib/whatsapp'
import Avatar from '../components/Avatar'
import WhatsAppButton from '../components/WhatsAppButton'

export default function SessionEnd() {
  const navigate = useNavigate()
  const { activeSession, sessionPlayers, games, players, endSession, saveBadges } = useSession()
  const [summary, setSummary] = useState(null)
  const [ended, setEnded] = useState(false)

  useEffect(() => {
    if (!activeSession || games.length === 0) return
    const { newBadges, potdPlayerId, stats } = evaluateBadgesAtSessionEnd(games, sessionPlayers, activeSession.id)
    setSummary({ badges: newBadges, potdPlayerId, stats })
  }, [activeSession, games, sessionPlayers])

  const handleEnd = async () => {
    if (!activeSession || !summary) return
    if (summary.badges.length > 0) await saveBadges(summary.badges)
    await endSession(activeSession.id, summary.potdPlayerId)
    setEnded(true)
  }

  const getPlayer = (id) => players.find(p => p.id === id)
  const potd = summary?.potdPlayerId ? getPlayer(summary.potdPlayerId) : null
  const completedGames = games.filter(g => g.status === 'completed')

  const handleShare = () => {
    const badgesList = (summary?.badges || []).map(b => ({
      ...BADGES[b.badge_type],
      player_id: b.player_id,
    }))
    const potdStat = summary?.stats?.[summary.potdPlayerId]
    shareSessionSummary({
      games: completedGames,
      players,
      potdName: potd?.name || 'N/A',
      potdStats: potdStat ? `${potdStat.wins}W ${potdStat.losses}L | +${potdStat.pointsScored - potdStat.pointsConceded} pts` : '',
      badges: badgesList,
      sessionDate: activeSession ? new Date(activeSession.date).toLocaleDateString() : '',
    })
  }

  if (ended) {
    return (
      <div className="page">
        <div className="card session-ended-card">
          <h2>Session Complete!</h2>
          {potd && (
            <div className="potd-display">
              <span className="potd-crown">{'\u{1F451}'}</span>
              <Avatar initials={potd.initials} color={potd.color} size={64} />
              <h3>{potd.name}</h3>
              <p>Player of the Day</p>
            </div>
          )}
          <WhatsAppButton onClick={handleShare} label="Share Summary" />
          <button className="btn btn-primary" onClick={() => navigate('/')}>Back to Home</button>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="card">
        <h2>End Session</h2>
        <p>{completedGames.length} games completed</p>

        {potd && (
          <div className="potd-preview">
            <h3>{'\u{1F451}'} Player of the Day</h3>
            <div className="potd-player">
              <Avatar initials={potd.initials} color={potd.color} size={48} />
              <span>{potd.name}</span>
            </div>
          </div>
        )}

        {summary?.badges?.length > 0 && (
          <div className="badges-preview">
            <h3>Badges Earned</h3>
            {summary.badges.map((b, i) => {
              const badge = BADGES[b.badge_type]
              const player = getPlayer(b.player_id)
              return (
                <div key={i} className="badge-row">
                  <span className="badge-icon">{badge?.icon}</span>
                  <span>{player?.name} - {badge?.label}</span>
                </div>
              )
            })}
          </div>
        )}

        <div className="session-end-actions">
          <button className="btn btn-danger btn-lg" onClick={handleEnd}>
            Confirm End Session
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/live')}>
            Back to Game
          </button>
        </div>
      </div>
    </div>
  )
}
