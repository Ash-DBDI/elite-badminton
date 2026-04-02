import { useSession } from '../context/SessionContext'
import { useNavigate } from 'react-router-dom'
import { getTier } from '../lib/eloEngine'
import { shareLeaderboard } from '../lib/whatsapp'
import Avatar from '../components/Avatar'
import WhatsAppButton from '../components/WhatsAppButton'

export default function Leaderboard() {
  const { players, loading } = useSession()
  const navigate = useNavigate()

  if (loading) return <div className="page-loading">Loading...</div>

  const sorted = [...players].sort((a, b) => b.skill_rating - a.skill_rating)

  const handleShare = () => {
    shareLeaderboard({ players: sorted, period: 'All-Time' })
  }

  return (
    <div className="page">
      <div className="card">
        <div className="card-header-row">
          <h2 className="card-title">Leaderboard</h2>
          <WhatsAppButton onClick={handleShare} label="Share" />
        </div>

        <div className="leaderboard-list">
          {sorted.map((player, i) => {
            const tier = getTier(player.skill_rating)
            const winRate = player.total_games > 0 ? Math.round((player.total_wins / player.total_games) * 100) : 0
            const medal = i === 0 ? '\u{1F451}' : i === 1 ? '\u{1F948}' : i === 2 ? '\u{1F949}' : `${i + 1}`

            return (
              <div
                key={player.id}
                className="leaderboard-row"
                onClick={() => navigate(`/player/${player.id}`)}
              >
                <span className="lb-rank">{medal}</span>
                <Avatar initials={player.initials} color={player.color} size={40} />
                <div className="lb-info">
                  <span className="lb-name">{player.name}</span>
                  <span className="lb-stats">
                    {player.total_wins}W {player.total_losses}L | {winRate}%
                  </span>
                </div>
                <div className="lb-rating">
                  <span className="lb-rating-num">{player.skill_rating}</span>
                  <span className="lb-tier" style={{ color: tier.color }}>{tier.label}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
