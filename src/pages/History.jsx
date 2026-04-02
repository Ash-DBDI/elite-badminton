import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Avatar from '../components/Avatar'

export default function History() {
  const [sessions, setSessions] = useState([])
  const [players, setPlayers] = useState([])
  const [expandedId, setExpandedId] = useState(null)
  const [sessionGames, setSessionGames] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const [{ data: s }, { data: p }] = await Promise.all([
        supabase.from('sessions').select('*').eq('status', 'completed').order('completed_at', { ascending: false }).limit(20),
        supabase.from('players').select('*'),
      ])
      setSessions(s || [])
      setPlayers(p || [])
      setLoading(false)
    }
    fetch()
  }, [])

  const toggleExpand = async (sessionId) => {
    if (expandedId === sessionId) {
      setExpandedId(null)
      return
    }
    setExpandedId(sessionId)
    if (!sessionGames[sessionId]) {
      const { data } = await supabase
        .from('games')
        .select('*')
        .eq('session_id', sessionId)
        .eq('status', 'completed')
        .order('game_number')
      setSessionGames(prev => ({ ...prev, [sessionId]: data || [] }))
    }
  }

  const getPlayer = (id) => players.find(p => p.id === id)

  if (loading) return <div className="page-loading">Loading...</div>

  if (sessions.length === 0) {
    return (
      <div className="page">
        <div className="card">
          <h2 className="card-title">Session History</h2>
          <p className="empty-state">No completed sessions yet</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="card">
        <h2 className="card-title">Session History</h2>
        <div className="history-list">
          {sessions.map(session => {
            const potd = session.player_of_day ? getPlayer(session.player_of_day) : null
            const isExpanded = expandedId === session.id
            const games = sessionGames[session.id] || []

            return (
              <div key={session.id} className="history-item">
                <div className="history-header" onClick={() => toggleExpand(session.id)}>
                  <div className="history-date">
                    {new Date(session.date).toLocaleDateString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric'
                    })}
                  </div>
                  <div className="history-meta">
                    <span>{session.duration_minutes}min</span>
                    {potd && (
                      <span className="history-potd">
                        {'\u{1F451}'} {potd.name}
                      </span>
                    )}
                  </div>
                  <span className="expand-icon">{isExpanded ? '\u25B2' : '\u25BC'}</span>
                </div>

                {isExpanded && (
                  <div className="history-games">
                    {games.map(game => {
                      const wonA = game.team_a_score > game.team_b_score
                      return (
                        <div key={game.id} className="history-game">
                          <span className="hg-num">G{game.game_number}</span>
                          <div className="hg-matchup">
                            <span className={wonA ? 'winner' : ''}>
                              {[game.team_a_player1, game.team_a_player2].map(id => getPlayer(id)?.name).filter(Boolean).join(' & ')}
                            </span>
                            <span className="hg-score">
                              {game.team_a_score} - {game.team_b_score}
                            </span>
                            <span className={!wonA ? 'winner' : ''}>
                              {[game.team_b_player1, game.team_b_player2].map(id => getPlayer(id)?.name).filter(Boolean).join(' & ')}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                    {games.length === 0 && <p className="empty-state">Loading games...</p>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
