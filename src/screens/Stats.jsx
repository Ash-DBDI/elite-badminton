import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'
import { tier } from '../lib/elo'
import Avatar from '../components/Avatar'

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
  const [todaySession, setTodaySession] = useState(null)
  const [badges, setBadges] = useState([])
  const [allBadges, setAllBadges] = useState([])

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: sess } = await supabase
      .from('sessions')
      .select('*, session_players(*, players(*)), games(*)')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    setTodaySession(sess)

    const { data: b } = await supabase.from('badges').select('*, players(name, initials)').order('earned_at', { ascending: false })
    setAllBadges(b || [])
    if (sess) {
      const { data: sb } = await supabase.from('badges').select('*, players(name, initials)').eq('session_id', sess.id)
      setBadges(sb || [])
    }
  }

  // FIX 3: Filter out 0-game players, FIX 1: sort by total_wins desc, then win% as tiebreaker
  const ranked = [...players]
    .filter(p => p.total_games > 0)
    .sort((a, b) => {
      if (b.total_wins !== a.total_wins) return b.total_wins - a.total_wins
      const wpA = a.total_games > 0 ? a.total_wins / a.total_games : 0
      const wpB = b.total_games > 0 ? b.total_wins / b.total_games : 0
      return wpB - wpA
    })

  // FIX 1: POTD comes from most recent completed session's player_of_day, not leaderboard
  const potd = todaySession?.player_of_day
    ? players.find(p => p.id === todaySession.player_of_day)
    : null
  const potdSp = todaySession?.session_players?.find(sp => sp.player_id === todaySession?.player_of_day)

  return (
    <div className="screen" style={{ padding: '20px 16px 90px' }}>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px', fontWeight: 300, marginBottom: '20px' }}>
        Stats
      </div>

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
          }}>{t}</button>
        ))}
      </div>

      {/* POTD section */}
      {tab === 'today' && (
        <div style={{
          background: 'linear-gradient(135deg, var(--gold-dim), var(--surface))',
          borderRadius: '16px', border: '1px solid var(--gold-border)',
          padding: '24px', textAlign: 'center', marginBottom: '20px'
        }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>{'\u{1F451}'}</div>
          {potd ? (
            <>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
                Player of the Day
              </div>
              <Avatar initials={potd.initials} size={56} index={players.indexOf(potd)} style={{ margin: '0 auto 10px' }} />
              <div style={{ fontSize: '20px', fontWeight: 600, marginBottom: '4px' }}>{potd.name}</div>
              {potdSp && (
                <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                  {potdSp.games_won}W {potdSp.games_played - potdSp.games_won}L {'\u00B7'} {potdSp.points_scored - potdSp.points_conceded > 0 ? '+' : ''}{potdSp.points_scored - potdSp.points_conceded} pts
                </div>
              )}
              {badges.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '10px', flexWrap: 'wrap' }}>
                  {badges.filter(b => b.player_id === potd.id).map((b, i) => (
                    <span key={i} style={{ fontSize: '12px', background: 'var(--surface)', padding: '3px 8px', borderRadius: '6px' }}>
                      {BADGE_DEFS[b.badge_type]?.icon} {BADGE_DEFS[b.badge_type]?.label}
                    </span>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '18px', fontWeight: 300, marginBottom: '4px' }}>
                No completed session yet
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Complete a session to crown POTD</div>
            </>
          )}
        </div>
      )}

      {/* Leaderboard */}
      <div style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', padding: '16px', marginBottom: '20px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '14px' }}>Leaderboard</div>

        {ranked.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)', fontSize: '13px' }}>
            No games played yet
          </div>
        )}

        {/* FIX 1 & 5: Podium — #2 left, #1 center (tallest), #3 right with correct medals */}
        {ranked.length >= 3 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '8px', marginBottom: '20px' }}>
            {/* #2 — left, medium */}
            {(() => {
              const p = ranked[1]
              return (
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <Avatar initials={p.initials} size={32} index={players.indexOf(p)} style={{ margin: '0 auto 6px' }} />
                  <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>{p.name}</div>
                  <div style={{
                    height: 60, borderRadius: '8px 8px 0 0',
                    background: 'rgba(192,192,192,0.13)', borderTop: '3px solid #c0c0c0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
                  }}>{'\u{1F948}'}</div>
                </div>
              )
            })()}
            {/* #1 — center, tallest */}
            {(() => {
              const p = ranked[0]
              return (
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <Avatar initials={p.initials} size={40} index={players.indexOf(p)} style={{ margin: '0 auto 6px' }} />
                  <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>{p.name}</div>
                  <div style={{
                    height: 80, borderRadius: '8px 8px 0 0',
                    background: 'var(--gold-dim)', borderTop: '3px solid var(--gold)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
                  }}>{'\u{1F451}'}</div>
                </div>
              )
            })()}
            {/* #3 — right, shortest */}
            {(() => {
              const p = ranked[2]
              return (
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <Avatar initials={p.initials} size={32} index={players.indexOf(p)} style={{ margin: '0 auto 6px' }} />
                  <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>{p.name}</div>
                  <div style={{
                    height: 50, borderRadius: '8px 8px 0 0',
                    background: 'rgba(205,127,50,0.13)', borderTop: '3px solid #cd7f32',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
                  }}>{'\u{1F949}'}</div>
                </div>
              )
            })()}
          </div>
        )}

        {/* Full ranked list — FIX 2: win% for anyone with games > 0, FIX 4: correct total_games */}
        {ranked.map((p, i) => {
          const t = tier(p.skill_rating, p.total_games)
          const wp = p.total_games > 0 ? Math.round((p.total_wins / p.total_games) * 100) + '%' : '\u2014'
          return (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '8px 0', borderTop: i === 0 ? 'none' : '1px solid var(--border)'
            }}>
              <span style={{ width: '20px', fontSize: '12px', fontWeight: 700, color: 'var(--muted)', textAlign: 'center' }}>{i + 1}</span>
              <Avatar initials={p.initials} size={30} index={players.indexOf(p)} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>{p.name}</div>
                <div style={{ fontSize: '10px', color: t.color, fontWeight: 600 }}>{t.label}</div>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'right' }}>
                <div>{p.total_wins}W {p.total_losses}L</div>
                <div>{wp}</div>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', width: '30px', textAlign: 'right' }}>{p.total_games}g</div>
            </div>
          )
        })}
      </div>

      {/* Badges grid */}
      <div style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', padding: '16px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '14px' }}>Badges</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          {Object.entries(BADGE_DEFS).map(([key, def]) => {
            const earned = allBadges.filter(b => b.badge_type === key)
            const hasAny = earned.length > 0
            const latest = earned[0]
            return (
              <div key={key} style={{
                padding: '12px', borderRadius: '10px',
                background: 'var(--surface2)', opacity: hasAny ? 1 : 0.4,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '4px', animation: hasAny ? 'badgePop 0.3s ease' : 'none' }}>
                  {hasAny ? def.icon : '\u{1F512}'}
                </div>
                <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '2px' }}>{def.label}</div>
                <div style={{ fontSize: '9px', color: 'var(--muted)' }}>{def.desc}</div>
                {latest?.players && (
                  <div style={{ fontSize: '9px', color: 'var(--gold)', marginTop: '4px' }}>
                    {latest.players.name}
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
