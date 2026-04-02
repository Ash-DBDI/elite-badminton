import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getTier } from '../lib/eloEngine'
import { BADGES } from '../lib/badgeEngine'
import { sharePlayerStats } from '../lib/whatsapp'
import Avatar from '../components/Avatar'
import WhatsAppButton from '../components/WhatsAppButton'

export default function PlayerProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [player, setPlayer] = useState(null)
  const [badges, setBadges] = useState([])
  const [recentGames, setRecentGames] = useState([])
  const [allPlayers, setAllPlayers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const [{ data: p }, { data: b }, { data: ap }] = await Promise.all([
        supabase.from('players').select('*').eq('id', id).single(),
        supabase.from('badges').select('*').eq('player_id', id).order('earned_at', { ascending: false }),
        supabase.from('players').select('*'),
      ])
      setPlayer(p)
      setBadges(b || [])
      setAllPlayers(ap || [])

      const { data: g } = await supabase
        .from('games')
        .select('*')
        .eq('status', 'completed')
        .or(`team_a_player1.eq.${id},team_a_player2.eq.${id},team_b_player1.eq.${id},team_b_player2.eq.${id}`)
        .order('completed_at', { ascending: false })
        .limit(10)
      setRecentGames(g || [])
      setLoading(false)
    }
    fetch()
  }, [id])

  if (loading || !player) return <div className="page-loading">Loading...</div>

  const tier = getTier(player.skill_rating)
  const ranked = player.total_games >= 20
  const winRate = player.total_games > 0 ? Math.round((player.total_wins / player.total_games) * 100) : 0
  const diff = player.total_points_scored - player.total_points_conceded
  const getPlayer = (pid) => allPlayers.find(p => p.id === pid)

  return (
    <div className="page">
      <button className="btn btn-secondary btn-sm back-btn" onClick={() => navigate(-1)}>
        Back
      </button>

      <div className="card profile-card">
        <div className="profile-header">
          <Avatar initials={player.initials} color={player.color} size={64} />
          <div className="profile-info">
            <h2>{player.name}</h2>
            {ranked ? (
              <span className="profile-tier" style={{ color: tier.color }}>
                {player.skill_rating} {tier.label}
              </span>
            ) : (
              <span className="profile-tier" style={{ color: '#888' }}>Unranked</span>
            )}
          </div>
          <WhatsAppButton onClick={() => sharePlayerStats(player)} label="Share" />
        </div>

        <div className="stats-grid">
          <div className="stat-box">
            <span className="stat-value">{player.total_games}</span>
            <span className="stat-label">Games</span>
          </div>
          <div className="stat-box">
            <span className="stat-value">{player.total_wins}</span>
            <span className="stat-label">Wins</span>
          </div>
          <div className="stat-box">
            <span className="stat-value">{winRate}%</span>
            <span className="stat-label">Win Rate</span>
          </div>
          <div className="stat-box">
            <span className="stat-value">{diff > 0 ? '+' : ''}{diff}</span>
            <span className="stat-label">Pt Diff</span>
          </div>
          <div className="stat-box">
            <span className="stat-value">{player.current_streak}</span>
            <span className="stat-label">Streak</span>
          </div>
          <div className="stat-box">
            <span className="stat-value">{player.best_streak}</span>
            <span className="stat-label">Best</span>
          </div>
        </div>
      </div>

      {badges.length > 0 && (
        <div className="card">
          <h3 className="card-title">Badges</h3>
          <div className="badges-grid">
            {badges.map((b, i) => {
              const badge = BADGES[b.badge_type]
              return badge ? (
                <div key={i} className="badge-card">
                  <span className="badge-icon-lg">{badge.icon}</span>
                  <span className="badge-label">{badge.label}</span>
                </div>
              ) : null
            })}
          </div>
        </div>
      )}

      {recentGames.length > 0 && (
        <div className="card">
          <h3 className="card-title">Recent Games</h3>
          {recentGames.map(game => {
            const inTeamA = [game.team_a_player1, game.team_a_player2].includes(id)
            const won = inTeamA
              ? game.team_a_score > game.team_b_score
              : game.team_b_score > game.team_a_score
            return (
              <div key={game.id} className={`recent-game ${won ? 'won' : 'lost'}`}>
                <span className="rg-result">{won ? 'W' : 'L'}</span>
                <div className="rg-teams">
                  <span>
                    {[game.team_a_player1, game.team_a_player2].map(pid => getPlayer(pid)?.name).filter(Boolean).join(' & ')}
                  </span>
                  <span className="rg-score">{game.team_a_score} - {game.team_b_score}</span>
                  <span>
                    {[game.team_b_player1, game.team_b_player2].map(pid => getPlayer(pid)?.name).filter(Boolean).join(' & ')}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
