import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { tier } from '../lib/elo'
import Avatar from '../components/Avatar'
import Header from '../components/Header'

const BADGE_DEFS = {
  HOT_HAND: { icon: '\u{1F525}', label: 'Hot Hand' }, LIGHTNING: { icon: '\u{26A1}', label: 'Lightning' },
  COMEBACK: { icon: '\u{1F4AA}', label: 'Comeback' }, THE_WALL: { icon: '\u{1F9F1}', label: 'The Wall' },
  SHARP_SHOOTER: { icon: '\u{1F3AF}', label: 'Sharp Shooter' }, POTD: { icon: '\u{1F451}', label: 'POTD' },
  BEST_DUO: { icon: '\u{1F91D}', label: 'Best Duo' }, MOST_IMPROVED: { icon: '\u{1F4C8}', label: 'Most Improved' },
  IRON_MAN: { icon: '\u{1F9BE}', label: 'Iron Man' }, FIRST_BLOOD: { icon: '\u{1FA78}', label: 'First Blood' },
}

export default function PlayerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [player, setPlayer] = useState(null)
  const [sessions, setSessions] = useState([])
  const [badges, setBadges] = useState([])
  const [allPlayers, setAllPlayers] = useState([])
  const [games, setGames] = useState([])
  const [expandedSession, setExpandedSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [id])

  async function load() {
    setLoading(true)
    const [{ data: p }, { data: b }, { data: ap }] = await Promise.all([
      supabase.from('players').select('*').eq('id', id).single(),
      supabase.from('badges').select('*').eq('player_id', id).order('earned_at', { ascending: false }),
      supabase.from('players').select('*')
    ])
    setPlayer(p); setBadges(b || []); setAllPlayers(ap || [])

    // Sessions this player participated in
    const { data: sp } = await supabase.from('session_players').select('*, sessions(*)').eq('player_id', id).order('id', { ascending: false })
    const sessData = (sp || []).filter(s => s.sessions).map(s => ({ ...s, session: s.sessions })).sort((a, b2) => new Date(b2.session.session_date) - new Date(a.session.session_date))
    setSessions(sessData)

    // All games this player was in
    const { data: g } = await supabase.from('games').select('*').eq('status', 'completed').or(`team_a_player1.eq.${id},team_a_player2.eq.${id},team_b_player1.eq.${id},team_b_player2.eq.${id}`).order('created_at', { ascending: false })
    setGames(g || [])
    setLoading(false)
  }

  if (loading || !player) return <div className="screen" style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--muted)' }}>Loading...</div>

  const t = tier(player.skill_rating, player.total_games)
  const winRate = player.total_games > 0 ? Math.round((player.total_wins / player.total_games) * 100) : null
  const ptDiff = player.total_points_scored - player.total_points_conceded
  const P = (pid) => allPlayers.find(pp => pp.id === pid) || { name: '?', initials: '??', avatar_id: 0 }
  const memberSince = player.created_at ? new Date(player.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''

  // Best partner & nemesis
  const partnerWins = {}; const opponentLosses = {}; const h2h = {}
  games.forEach(g => {
    const inA = [g.team_a_player1, g.team_a_player2].includes(id)
    const partner = inA ? (g.team_a_player1 === id ? g.team_a_player2 : g.team_a_player1) : (g.team_b_player1 === id ? g.team_b_player2 : g.team_b_player1)
    const opps = inA ? [g.team_b_player1, g.team_b_player2] : [g.team_a_player1, g.team_a_player2]
    const won = inA ? g.team_a_score > g.team_b_score : g.team_b_score > g.team_a_score
    if (won && partner) partnerWins[partner] = (partnerWins[partner] || 0) + 1
    opps.filter(Boolean).forEach(opp => {
      if (!won) opponentLosses[opp] = (opponentLosses[opp] || 0) + 1
      if (!h2h[opp]) h2h[opp] = { w: 0, l: 0 }
      if (won) h2h[opp].w++; else h2h[opp].l++
    })
  })
  const bestPartner = Object.entries(partnerWins).sort((a, b2) => b2[1] - a[1])[0]
  const nemesis = Object.entries(opponentLosses).sort((a, b2) => b2[1] - a[1])[0]

  // Session chart data (last 10)
  const chartSessions = sessions.filter(s => s.games_played > 0).slice(0, 10).reverse()

  const box = { background: 'var(--surface2)', borderRadius: '10px', padding: '14px', textAlign: 'center' }
  const boxVal = { fontSize: '20px', fontWeight: 800, color: 'var(--gold)', marginBottom: '2px' }
  const boxLbl = { fontSize: '10px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }

  return (
    <div className="screen" style={{ padding: '16px 16px 90px' }}>
      <Header title="Player Profile" showBack />

      {/* Header */}
      <div style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', padding: '24px', textAlign: 'center', marginBottom: '12px' }}>
        <Avatar initials={player.initials} size={72} index={allPlayers.indexOf(player)} avatarId={player.avatar_id} style={{ margin: '0 auto 12px' }} />
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '26px', fontWeight: 400, marginBottom: '4px' }}>{player.name}</div>
        <div style={{ fontSize: '12px', color: t.color, fontWeight: 600, marginBottom: '4px' }}>{t.label}</div>
        <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Member since {memberSince}</div>
      </div>

      {/* Career Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
        <div style={box}><div style={boxVal}>{winRate !== null ? winRate + '%' : '\u2014'}</div><div style={boxLbl}>Win Rate</div></div>
        <div style={box}><div style={boxVal}>{player.total_wins}W {'\u00B7'} {player.total_losses}L</div><div style={boxLbl}>Record</div></div>
        <div style={box}><div style={{ ...boxVal, color: ptDiff >= 0 ? 'var(--green)' : 'var(--red)' }}>{ptDiff > 0 ? '+' : ''}{ptDiff}</div><div style={boxLbl}>Point Diff</div></div>
        <div style={box}><div style={boxVal}>{player.best_streak}</div><div style={boxLbl}>Best Streak</div></div>
      </div>

      {/* Streak banner */}
      {player.current_streak >= 2 && (
        <div style={{ background: 'var(--gold-dim)', border: '1px solid var(--gold-border)', borderRadius: '10px', padding: '10px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: 'var(--gold)', marginBottom: '12px' }}>
          {'\u{1F525}'} On a {player.current_streak} game win streak
        </div>
      )}

      {/* Best partner / Nemesis */}
      {(bestPartner || nemesis) && (
        <div style={{ background: 'var(--surface)', borderRadius: '14px', border: '1px solid var(--border)', padding: '14px', marginBottom: '12px' }}>
          {bestPartner && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: nemesis ? '8px' : 0 }}>
              <span style={{ fontSize: '16px' }}>{'\u{1F91D}'}</span>
              <Avatar initials={P(bestPartner[0]).initials} size={24} index={allPlayers.indexOf(P(bestPartner[0]))} avatarId={P(bestPartner[0]).avatar_id} />
              <span style={{ fontSize: '12px' }}>Best partner: <b>{P(bestPartner[0]).name}</b> {'\u2014'} {bestPartner[1]}W together</span>
            </div>
          )}
          {nemesis && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>{'\u{1F525}'}</span>
              <Avatar initials={P(nemesis[0]).initials} size={24} index={allPlayers.indexOf(P(nemesis[0]))} avatarId={P(nemesis[0]).avatar_id} />
              <span style={{ fontSize: '12px' }}>Toughest opponent: <b>{P(nemesis[0]).name}</b> {'\u2014'} {nemesis[1]} losses against</span>
            </div>
          )}
        </div>
      )}

      {/* Performance chart */}
      <div style={{ background: 'var(--surface)', borderRadius: '14px', border: '1px solid var(--border)', padding: '16px', marginBottom: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>Performance</div>
        {chartSessions.length < 3 ? (
          <div style={{ textAlign: 'center', padding: '16px', color: 'var(--muted)', fontSize: '12px' }}>Play more sessions to see trends</div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '100px' }}>
            {chartSessions.map((s, i) => {
              const wr = s.games_played > 0 ? Math.round((s.games_won / s.games_played) * 100) : 0
              const h = Math.max(8, wr)
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }} onClick={() => setExpandedSession(expandedSession === s.session_id ? null : s.session_id)}>
                  <div style={{ width: '100%', height: h + '%', minHeight: '4px', borderRadius: '4px 4px 0 0', background: wr >= 50 ? 'var(--green)' : 'var(--red)', opacity: expandedSession === s.session_id ? 1 : 0.7, transition: 'opacity 0.2s' }} />
                  <span style={{ fontSize: '7px', color: 'var(--muted)' }}>{new Date(s.session.session_date + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Session history */}
      <div style={{ background: 'var(--surface)', borderRadius: '14px', border: '1px solid var(--border)', padding: '16px', marginBottom: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>Session History</div>
        {sessions.length === 0 && <div style={{ color: 'var(--muted)', fontSize: '12px', textAlign: 'center', padding: '12px' }}>No sessions yet</div>}
        {sessions.filter(s => s.games_played > 0).map(s => {
          const isExp = expandedSession === s.session_id
          const sessionBadges = badges.filter(b => b.session_id === s.session_id)
          const sessionGames = games.filter(g => g.session_id === s.session_id).sort((a, b2) => a.game_number - b2.game_number)
          const diff = s.points_scored - s.points_conceded
          return (
            <div key={s.id} style={{ borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '8px' }}>
              <div onClick={() => setExpandedSession(isExp ? null : s.session_id)} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '4px 0' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', fontWeight: 600 }}>{new Date(s.session.session_date + 'T00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{s.games_won}W {'\u00B7'} {s.games_played - s.games_won}L</div>
                </div>
                <span style={{ fontSize: '12px', color: diff >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>{diff > 0 ? '+' : ''}{diff}</span>
                {sessionBadges.map((b, i) => <span key={i} style={{ fontSize: '14px' }}>{BADGE_DEFS[b.badge_type]?.icon || ''}</span>)}
                <span style={{ fontSize: '10px', color: 'var(--muted)' }}>{isExp ? '\u25B2' : '\u25BC'}</span>
              </div>
              {isExp && sessionGames.length > 0 && (
                <div style={{ padding: '8px 0 4px 8px' }}>
                  {sessionGames.map(g => {
                    const inA = [g.team_a_player1, g.team_a_player2].includes(id)
                    const won = inA ? g.team_a_score > g.team_b_score : g.team_b_score > g.team_a_score
                    const partner = inA ? (g.team_a_player1 === id ? g.team_a_player2 : g.team_a_player1) : (g.team_b_player1 === id ? g.team_b_player2 : g.team_b_player1)
                    return (
                      <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 0', fontSize: '11px' }}>
                        <span style={{ color: won ? 'var(--green)' : 'var(--red)', fontWeight: 700, width: '14px' }}>{won ? 'W' : 'L'}</span>
                        <span>w/ {P(partner).name}</span>
                        <span style={{ fontWeight: 700 }}>{g.team_a_score}{'\u2013'}{g.team_b_score}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Head to head */}
      {Object.keys(h2h).length > 0 && (
        <div style={{ background: 'var(--surface)', borderRadius: '14px', border: '1px solid var(--border)', padding: '16px', marginBottom: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>Head to Head</div>
          {Object.entries(h2h).sort((a, b2) => (b2[1].w + b2[1].l) - (a[1].w + a[1].l)).map(([oppId, rec]) => {
            const opp = P(oppId)
            return (
              <div key={oppId} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', borderTop: '1px solid var(--border)' }}>
                <Avatar initials={opp.initials} size={24} index={allPlayers.indexOf(opp)} avatarId={opp.avatar_id} />
                <span style={{ flex: 1, fontSize: '12px', fontWeight: 500 }}>{opp.name}</span>
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{rec.w}W {'\u00B7'} {rec.l}L</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Badges */}
      <div style={{ background: 'var(--surface)', borderRadius: '14px', border: '1px solid var(--border)', padding: '16px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Badges</div>
        <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '10px' }}>{badges.length} of {Object.keys(BADGE_DEFS).length} earned</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
          {Object.entries(BADGE_DEFS).map(([key, def]) => {
            const earned = badges.find(b => b.badge_type === key)
            return (
              <div key={key} style={{ textAlign: 'center', opacity: earned ? 1 : 0.3, padding: '6px' }}>
                <div style={{ fontSize: '20px' }}>{earned ? def.icon : '\u{1F512}'}</div>
                <div style={{ fontSize: '7px', color: 'var(--muted)', marginTop: '2px' }}>{def.label}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
