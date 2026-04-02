import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Avatar from '../components/Avatar'

const BADGE_DEFS = {
  HOT_HAND: { icon: '\u{1F525}', label: 'Hot Hand' },
  LIGHTNING: { icon: '\u{26A1}', label: 'Lightning' },
  COMEBACK: { icon: '\u{1F4AA}', label: 'Comeback' },
  THE_WALL: { icon: '\u{1F9F1}', label: 'The Wall' },
  SHARP_SHOOTER: { icon: '\u{1F3AF}', label: 'Sharp Shooter' },
  POTD: { icon: '\u{1F451}', label: 'POTD' },
  BEST_DUO: { icon: '\u{1F91D}', label: 'Best Duo' },
  MOST_IMPROVED: { icon: '\u{1F4C8}', label: 'Most Improved' },
  IRON_MAN: { icon: '\u{1F9BE}', label: 'Iron Man' },
  FIRST_BLOOD: { icon: '\u{1FA78}', label: 'First Blood' },
}

export default function History() {
  const [sessions, setSessions] = useState([])
  const [allPlayers, setAllPlayers] = useState([])
  const [expanded, setExpanded] = useState(null)
  const [sessionData, setSessionData] = useState({})

  useEffect(() => {
    loadSessions()
    loadPlayers()
  }, [])

  async function loadSessions() {
    const { data } = await supabase.from('sessions')
      .select('*, session_players(count)')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(30)
    setSessions(data || [])
  }

  async function loadPlayers() {
    const { data } = await supabase.from('players').select('*')
    setAllPlayers(data || [])
  }

  async function toggleExpand(sid) {
    if (expanded === sid) { setExpanded(null); return }
    setExpanded(sid)
    if (!sessionData[sid]) {
      const [{ data: games }, { data: sp }, { data: badges }] = await Promise.all([
        supabase.from('games').select('*').eq('session_id', sid).eq('status', 'completed').order('game_number'),
        supabase.from('session_players').select('*, players(*)').eq('session_id', sid),
        supabase.from('badges').select('*').eq('session_id', sid)
      ])
      setSessionData(prev => ({ ...prev, [sid]: { games: games || [], sp: sp || [], badges: badges || [] } }))
    }
  }

  const P = (id) => allPlayers.find(p => p.id === id) || { name: '?', initials: '??' }

  function shareSession(session, data) {
    if (!data) return
    const lines = [
      '\u{1F3F8} Elite Badminton Social',
      `${new Date(session.session_date + 'T00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} \u00B7 ${data.games.length} games`,
      ''
    ]

    const potd = session.player_of_day ? P(session.player_of_day) : null
    if (potd) lines.push(`\u{1F451} Player of the Day: ${potd.name}`, '')

    lines.push('Results:')
    data.games.forEach(g => {
      const aWon = g.team_a_score > g.team_b_score
      const tA = `${P(g.team_a_player1).name} & ${P(g.team_a_player2).name}`
      const tB = `${P(g.team_b_player1).name} & ${P(g.team_b_player2).name}`
      lines.push(`Game ${g.game_number}: ${tA} ${g.team_a_score}\u2013${g.team_b_score} ${tB} ${aWon ? '\u{1F3C6}' : ''}${!aWon ? '\u{1F3C6}' : ''}`)
    })

    if (data.badges.length > 0) {
      lines.push('', '\u{1F3C5} Badges:')
      data.badges.forEach(b => {
        const def = BADGE_DEFS[b.badge_type]
        lines.push(`${def?.icon || ''} ${P(b.player_id).name} \u2014 ${def?.label || b.badge_type}`)
      })
    }

    lines.push('', 'elitebadminton.netlify.app')
    const msg = lines.join('\n')
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <div className="screen" style={{ padding: '20px 16px 90px' }}>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px', fontWeight: 300, marginBottom: '20px' }}>
        History
      </div>

      {sessions.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)', fontSize: '14px' }}>
          No completed sessions yet
        </div>
      )}

      {sessions.map(s => {
        const isExp = expanded === s.id
        const data = sessionData[s.id]
        const potd = s.player_of_day ? P(s.player_of_day) : null
        const playerCount = s.session_players?.[0]?.count || 0

        return (
          <div key={s.id} style={{
            background: 'var(--surface)', borderRadius: '14px',
            border: '1px solid var(--border)', marginBottom: '10px',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div onClick={() => toggleExpand(s.id)} style={{
              padding: '14px 16px', cursor: 'pointer',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>
                  {new Date(s.session_date + 'T00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', display: 'flex', gap: '8px', marginTop: '2px' }}>
                  <span>{s.session_time}</span>
                  <span>{s.duration_minutes}min</span>
                  <span>{playerCount} players</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {potd && (
                  <span style={{ fontSize: '12px', color: 'var(--gold)' }}>
                    {'\u{1F451}'} {potd.name}
                  </span>
                )}
                <span style={{ fontSize: '10px', color: 'var(--muted)' }}>{isExp ? '\u25B2' : '\u25BC'}</span>
              </div>
            </div>

            {/* Expanded content */}
            {isExp && data && (
              <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
                {/* Locked badge */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  fontSize: '10px', color: 'var(--muted)', fontWeight: 600,
                  background: 'var(--surface2)', padding: '4px 10px', borderRadius: '6px',
                  margin: '12px 0 14px', textTransform: 'uppercase', letterSpacing: '0.08em'
                }}>
                  {'\u{1F512}'} Permanent Record
                </div>

                {/* Player records */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', fontWeight: 600 }}>
                    Players
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {data.sp.sort((a, b) => b.games_won - a.games_won).map((sp, i) => (
                      <div key={sp.id} style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        background: 'var(--surface2)', padding: '6px 10px', borderRadius: '8px',
                        fontSize: '12px'
                      }}>
                        <Avatar initials={sp.players?.initials || '??'} size={22} index={i} avatarId={sp.players?.avatar_id} />
                        <span style={{ fontWeight: 500 }}>{sp.players?.name}</span>
                        <span style={{ color: 'var(--muted)' }}>{sp.games_won}W {sp.games_played - sp.games_won}L</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Game results */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', fontWeight: 600 }}>
                    Results
                  </div>
                  {data.games.map(g => {
                    const aWon = g.team_a_score > g.team_b_score
                    return (
                      <div key={g.id} style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '6px 0', fontSize: '12px'
                      }}>
                        <span style={{ color: 'var(--muted)', fontWeight: 700, minWidth: '24px' }}>G{g.game_number}</span>
                        <span style={{ flex: 1, fontWeight: aWon ? 600 : 400, color: aWon ? 'var(--gold)' : 'var(--text)' }}>
                          {P(g.team_a_player1).name} & {P(g.team_a_player2).name}
                        </span>
                        <span style={{ fontWeight: 700, minWidth: '50px', textAlign: 'center' }}>
                          {g.team_a_score} {'\u2013'} {g.team_b_score}
                        </span>
                        <span style={{ flex: 1, fontWeight: !aWon ? 600 : 400, color: !aWon ? 'var(--gold)' : 'var(--text)', textAlign: 'right' }}>
                          {P(g.team_b_player1).name} & {P(g.team_b_player2).name}
                        </span>
                        <span style={{ fontSize: '14px' }}>{aWon ? '\u{1F3C6}' : ''}</span>
                      </div>
                    )
                  })}
                </div>

                {/* Badges */}
                {data.badges.length > 0 && (
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', fontWeight: 600 }}>
                      Badges Earned
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {data.badges.map((b, i) => {
                        const def = BADGE_DEFS[b.badge_type]
                        return (
                          <span key={i} style={{
                            fontSize: '11px', background: 'var(--surface2)',
                            padding: '4px 10px', borderRadius: '6px'
                          }}>
                            {def?.icon} {P(b.player_id).name} {'\u2014'} {def?.label}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* WhatsApp share */}
                <button onClick={() => shareSession(s, data)} style={{
                  width: '100%', padding: '12px', borderRadius: '10px',
                  background: '#25D366', border: 'none', color: '#fff',
                  fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Share on WhatsApp
                </button>
              </div>
            )}

            {isExp && !data && (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>Loading...</div>
            )}
          </div>
        )
      })}
    </div>
  )
}
