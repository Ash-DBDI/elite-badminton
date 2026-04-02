import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'
import { tier } from '../lib/elo'
import Avatar from '../components/Avatar'
import Header from '../components/Header'

const BADGE_DEFS = {
  HOT_HAND: { icon: '\u{1F525}', label: 'Hot Hand', desc: '3 wins in a row' },
  LIGHTNING: { icon: '\u{26A1}', label: 'Lightning', desc: 'Won 21\u20139 or better' },
  COMEBACK: { icon: '\u{1F4AA}', label: 'Comeback', desc: 'Won after trailing 10+' },
  THE_WALL: { icon: '\u{1F9F1}', label: 'The Wall', desc: 'Fewest pts conceded' },
  SHARP_SHOOTER: { icon: '\u{1F3AF}', label: 'Sharp Shooter', desc: 'Highest game score' },
  POTD: { icon: '\u{1F451}', label: 'Player of Day', desc: 'Best performance' },
  BEST_DUO: { icon: '\u{1F91D}', label: 'Best Duo', desc: 'Most wins as pair' },
  MOST_IMPROVED: { icon: '\u{1F4C8}', label: 'Most Improved', desc: 'Biggest rating gain' },
  IRON_MAN: { icon: '\u{1F9BE}', label: 'Iron Man', desc: 'Played every game' },
  FIRST_BLOOD: { icon: '\u{1FA78}', label: 'First Blood', desc: 'Won game 1' },
}

export default function Stats() {
  const { players } = useApp()
  const [tab, setTab] = useState('today')
  const [lastSession, setLastSession] = useState(null)
  const [sessionBadges, setSessionBadges] = useState([])
  const [allBadges, setAllBadges] = useState([])

  useEffect(() => { loadData() }, [])

  async function loadData() {
    // Most recent completed session with POTD
    const { data: sess } = await supabase
      .from('sessions')
      .select('*, session_players(*, players(*)), games(*)')
      .eq('status', 'completed')
      .not('player_of_day', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    setLastSession(sess)

    const { data: ab } = await supabase.from('badges').select('*, players(name, initials)').order('earned_at', { ascending: false })
    setAllBadges(ab || [])

    if (sess) {
      const { data: sb } = await supabase.from('badges').select('*, players(name, initials)').eq('session_id', sess.id)
      setSessionBadges(sb || [])
    }
  }

  // Leaderboard: filter 0-game players, sort by win% desc, then wins, then games
  const ranked = [...players]
    .filter(p => p.total_games > 0)
    .sort((a, b) => {
      const wpA = a.total_wins / a.total_games
      const wpB = b.total_wins / b.total_games
      if (wpB !== wpA) return wpB - wpA
      if (b.total_wins !== a.total_wins) return b.total_wins - a.total_wins
      return b.total_games - a.total_games
    })

  // POTD from most recent completed session
  const potd = lastSession?.player_of_day ? players.find(p => p.id === lastSession.player_of_day) : null
  const potdSp = lastSession?.session_players?.find(sp => sp.player_id === lastSession?.player_of_day)

  const tabLabels = { today: 'Latest Session', month: 'Monthly', quarter: 'All Time' }

  return (
    <div className="screen" style={{ padding: '20px 16px 90px' }}>
      <Header />
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px', fontWeight: 300, marginBottom: '20px' }}>Stats</div>

      {/* Tab toggle */}
      <div style={{ display: 'flex', gap: '4px', background: 'var(--surface2)', borderRadius: '10px', padding: '3px', marginBottom: '20px' }}>
        {['today', 'month', 'quarter'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '8px', borderRadius: '8px',
            background: tab === t ? 'var(--surface)' : 'transparent',
            border: 'none', color: tab === t ? 'var(--text)' : 'var(--muted)',
            fontWeight: tab === t ? 600 : 400, fontSize: '12px',
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            textTransform: 'capitalize', transition: 'all 0.15s'
          }}>{t === 'today' ? 'Today' : t === 'month' ? 'Month' : 'Quarter'}</button>
        ))}
      </div>

      {/* POTD */}
      {tab === 'today' && (
        <div style={{ background: 'linear-gradient(135deg, var(--gold-dim), var(--surface))', borderRadius: '16px', border: '1px solid var(--gold-border)', padding: '24px', textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>{'\u{1F451}'}</div>
          {potd ? (
            <>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Player of the Day</div>
              <Avatar initials={potd.initials} size={56} index={players.indexOf(potd)} avatarId={potd.avatar_id} style={{ margin: '0 auto 10px' }} />
              <div style={{ fontSize: '20px', fontWeight: 600, marginBottom: '4px' }}>{potd.name}</div>
              {potdSp && (
                <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                  {potdSp.games_won}W {potdSp.games_played - potdSp.games_won}L {'\u00B7'} {(potdSp.points_scored - potdSp.points_conceded) >= 0 ? '+' : ''}{potdSp.points_scored - potdSp.points_conceded} pts
                </div>
              )}
              {sessionBadges.filter(b => b.player_id === potd.id).length > 0 && (
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '10px', flexWrap: 'wrap' }}>
                  {sessionBadges.filter(b => b.player_id === potd.id).map((b, i) => (
                    <span key={i} style={{ fontSize: '12px', background: 'var(--surface)', padding: '3px 8px', borderRadius: '6px' }}>
                      {BADGE_DEFS[b.badge_type]?.icon} {BADGE_DEFS[b.badge_type]?.label}
                    </span>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '18px', fontWeight: 300, marginBottom: '4px' }}>No completed sessions yet</div>
              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Complete a session to crown POTD</div>
            </>
          )}
        </div>
      )}

      {/* Leaderboard */}
      <div style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', padding: '16px', marginBottom: '20px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '14px' }}>{tabLabels[tab]} Leaderboard</div>

        {ranked.length === 0 && <div style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)', fontSize: '13px' }}>No games played yet</div>}

        {/* Podium: #2 left, #1 center tallest, #3 right */}
        {ranked.length >= 3 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '8px', marginBottom: '20px' }}>
            {/* #2 left */}
            <div style={{ textAlign: 'center', flex: 1 }}>
              <Avatar initials={ranked[1].initials} size={32} index={players.indexOf(ranked[1])} avatarId={ranked[1].avatar_id} style={{ margin: '0 auto 6px' }} />
              <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>{ranked[1].name}</div>
              <div style={{ height: 70, borderRadius: '8px 8px 0 0', background: 'rgba(192,192,192,0.13)', borderTop: '3px solid #c0c0c0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '20px' }}>{'\u{1F948}'}</span>
                <span style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '2px' }}>{ranked[1].total_wins}W</span>
              </div>
            </div>
            {/* #1 center */}
            <div style={{ textAlign: 'center', flex: 1 }}>
              <Avatar initials={ranked[0].initials} size={40} index={players.indexOf(ranked[0])} avatarId={ranked[0].avatar_id} style={{ margin: '0 auto 6px' }} />
              <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>{ranked[0].name}</div>
              <div style={{ height: 100, borderRadius: '8px 8px 0 0', background: 'var(--gold-dim)', borderTop: '3px solid var(--gold)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '20px' }}>{'\u{1F451}'}</span>
                <span style={{ fontSize: '10px', color: 'var(--gold)', marginTop: '2px', fontWeight: 700 }}>{ranked[0].total_wins}W</span>
              </div>
            </div>
            {/* #3 right */}
            <div style={{ textAlign: 'center', flex: 1 }}>
              <Avatar initials={ranked[2].initials} size={32} index={players.indexOf(ranked[2])} avatarId={ranked[2].avatar_id} style={{ margin: '0 auto 6px' }} />
              <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>{ranked[2].name}</div>
              <div style={{ height: 50, borderRadius: '8px 8px 0 0', background: 'rgba(205,127,50,0.13)', borderTop: '3px solid #cd7f32', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '20px' }}>{'\u{1F949}'}</span>
                <span style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '2px' }}>{ranked[2].total_wins}W</span>
              </div>
            </div>
          </div>
        )}

        {/* Full ranked list */}
        {ranked.map((p, i) => {
          const t = tier(p.skill_rating, p.total_games)
          const wp = Math.round((p.total_wins / p.total_games) * 100)
          return (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
              <span style={{ width: '20px', fontSize: '12px', fontWeight: 700, color: 'var(--muted)', textAlign: 'center' }}>{i + 1}</span>
              <Avatar initials={p.initials} size={30} index={players.indexOf(p)} avatarId={p.avatar_id} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>{p.name}</div>
                <div style={{ fontSize: '10px', color: t.color, fontWeight: 600 }}>{t.label}</div>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'right', minWidth: '55px' }}>
                {p.total_wins}W {p.total_losses}L
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', textAlign: 'right', minWidth: '36px' }}>
                {wp}%
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', width: '30px', textAlign: 'right' }}>{p.total_games}g</div>
            </div>
          )
        })}
      </div>

      {/* Badges */}
      <div style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', padding: '16px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '14px' }}>Badges</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          {Object.entries(BADGE_DEFS).map(([key, def]) => {
            const earned = allBadges.filter(b => b.badge_type === key)
            const hasAny = earned.length > 0
            const latest = earned[0]
            return (
              <div key={key} style={{ padding: '12px', borderRadius: '10px', background: 'var(--surface2)', opacity: hasAny ? 1 : 0.4, textAlign: 'center' }}>
                <div style={{ fontSize: '24px', marginBottom: '4px', animation: hasAny ? 'badgePop 0.3s ease' : 'none' }}>
                  {hasAny ? def.icon : '\u{1F512}'}
                </div>
                <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '2px' }}>{def.label}</div>
                <div style={{ fontSize: '9px', color: 'var(--muted)' }}>{hasAny ? def.desc : 'Locked'}</div>
                {latest?.players && <div style={{ fontSize: '9px', color: 'var(--gold)', marginTop: '4px' }}>{latest.players.name}</div>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
