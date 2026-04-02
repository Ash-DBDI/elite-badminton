import { useNavigate } from 'react-router-dom'
import { useSession } from '../context/SessionContext'
import Avatar from '../components/Avatar'
import { getTier } from '../lib/eloEngine'

export default function Home() {
  const navigate = useNavigate()
  const { activeSession, players, loading } = useSession()

  if (loading) return <div className="page-loading">Loading...</div>

  const topPlayers = [...players].sort((a, b) => b.skill_rating - a.skill_rating).slice(0, 3)

  return (
    <div className="page home-page">
      <div className="hero-section">
        <h2 className="hero-title">Elite Badminton Social</h2>
        <p className="hero-subtitle">Track games, rate players, crown champions</p>

        {activeSession ? (
          <button
            className="btn btn-primary btn-lg"
            onClick={() => navigate(activeSession.status === 'setup' ? '/session' : '/live')}
          >
            {activeSession.status === 'setup' ? 'Continue Setup' : 'Join Live Session'}
          </button>
        ) : (
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/session')}>
            Start New Session
          </button>
        )}
      </div>

      {topPlayers.length > 0 && (
        <div className="card">
          <h3 className="card-title">Top Rated Players</h3>
          <div className="top-players">
            {topPlayers.map((player, i) => {
              const tier = getTier(player.skill_rating)
              const medal = i === 0 ? '\u{1F451}' : i === 1 ? '\u{1F948}' : '\u{1F949}'
              return (
                <div
                  key={player.id}
                  className="top-player-card"
                  onClick={() => navigate(`/player/${player.id}`)}
                >
                  <span className="medal">{medal}</span>
                  <Avatar initials={player.initials} color={player.color} size={48} />
                  <div className="top-player-info">
                    <span className="top-player-name">{player.name}</span>
                    <span className="top-player-rating" style={{ color: tier.color }}>
                      {player.skill_rating} {tier.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="quick-stats">
        <div className="stat-card" onClick={() => navigate('/leaderboard')}>
          <span className="stat-icon">{'\u{1F3C6}'}</span>
          <span className="stat-label">Leaderboard</span>
        </div>
        <div className="stat-card" onClick={() => navigate('/history')}>
          <span className="stat-icon">{'\u{1F4CB}'}</span>
          <span className="stat-label">History</span>
        </div>
        <div className="stat-card" onClick={() => navigate('/players')}>
          <span className="stat-icon">{'\u{1F465}'}</span>
          <span className="stat-label">Players</span>
        </div>
      </div>
    </div>
  )
}
