import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'
import { tier } from '../lib/elo'
import Avatar from '../components/Avatar'
import Header from '../components/Header'
import { shareLeaderboard } from '../lib/whatsapp'

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
  const [potdPlayer, setPotdPlayer] = useState(null)
  const [potdSp, setPotdSp] = useState(null)
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

    if (sess?.player_of_day) {
      const { data: p } = await supabase.from('players').select('*').eq('id', sess.player_of_day).single()
      setPotdPlayer(p)
      const sp = sess?.session_players?.find(s => s.player_id === sess.player_of_day)
      setPotdSp(sp)
    }

    const { data: ab } = await supabase.from('badges').select('*, players(name, initials)').order('earned_at', { ascending: false })
    setAllBadges(ab || [])

    if (sess) {
      const { data: sb } = await supabase.from('badges').select('*, players(name, initials)').eq('session_id', sess.id)
      setSessionBadges(sb || [])
    }
  }

  // Ranking: filter 0-game, sort by win% desc, total_wins desc, total_games desc
  const ranked = [...players]
    .filter(p => p.total_games > 0)
    .sort((a, b) => {
      const wpA = Math.round((a.total_wins / a.total_games) * 100)
      const wpB = Math.round((b.total_wins / b.total_games) * 100)
      if (wpB !== wpA) return wpB - wpA
      if (b.total_wins !== a.total_wins) return b.total_wins - a.total_wins
      return b.total_games - a.total_games
    })

  const tabLabels = { today: 'Latest Session', month: 'Monthly', quarter: 'All Time' }

  function PodiumSlot({ player, rank, height, medal, borderColor }) {
    if (!player) return null
    const wp = Math.round((player.total_wins / player.total_games) * 100)
    return (
      <div style={{ textAlign: 'center', flex: 1 }}>
        <div style={{ fontSize: '22px', marginBottom: '4px' }}>{medal}</div>
        <Avatar initials={player.initials} size={rank === 0 ? 44 : 34} index={players.indexOf(player)} avatarId={player.avatar_id} style={{ margin: '0 auto 6px' }} />
        <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '2px' }}>{player.name}</div>
        <div style={{ fontSize: '9px', color: 'var(--muted)', marginBottom: '6px' }}>
          {player.total_wins}W {'\u00B7'} {player.total_losses}L
        </div>
        <div style={{
          height, borderRadius: '8px 8px 0 0',
          background: `${borderColor}18`,
          borderTop: `3px solid ${borderColor}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', fontWeight: 800, color: borderColor
        }}>
          {rank + 1}
        </div>
      </div>
    )
  }

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
          {potdPlayer ? (
            <>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Player of the Day</div>
              <Avatar initials={potdPlayer.initials} size={56} index={players.indexOf(potdPlayer)} avatarId={potdPlayer.avatar_id} style={{ margin: '0 auto 10px' }} />
              <div style={{ fontSize: '20px', fontWeight: 600, marginBottom: '4px' }}>{potdPlayer.name}</div>
              {potdSp && (
                <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                  {potdSp.games_won}W {potdSp.games_played - potdSp.games_won}L {'\u00B7'} {(potdSp.points_scored - potdSp.points_conceded) >= 0 ? '+' : ''}{potdSp.points_scored - potdSp.points_conceded} pts
                </div>
              )}
              {sessionBadges.filter(b => b.player_id === potdPlayer.id).length > 0 && (
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '10px', flexWrap: 'wrap' }}>
                  {sessionBadges.filter(b => b.player_id === potdPlayer.id).map((b, i) => (
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
              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Complete a session to crown Player of the Day</div>
            </>
          )}
        </div>
      )}

      {/* Leaderboard */}
      <div style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', padding: '16px', marginBottom: '20px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '14px' }}>{tabLabels[tab]} Leaderboard</div>

        {ranked.length === 0 && <div style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)', fontSize: '13px' }}>No games played yet</div>}

        {/* Podium: #2 left, #1 center (tallest), #3 right */}
        {ranked.length >= 3 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '8px', marginBottom: '20px' }}>
            <PodiumSlot player={ranked[1]} rank={1} height={75} medal={'\u{1F948}'} borderColor="#c0c0c0" />
            <PodiumSlot player={ranked[0]} rank={0} height={110} medal={'\u{1F451}'} borderColor="var(--gold)" />
            <PodiumSlot player={ranked[2]} rank={2} height={55} medal={'\u{1F949}'} borderColor="#cd7f32" />
          </div>
        )}
        {ranked.length === 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <PodiumSlot player={ranked[0]} rank={0} height={110} medal={'\u{1F451}'} borderColor="var(--gold)" />
          </div>
        )}
        {ranked.length === 2 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '12px', marginBottom: '20px' }}>
            <PodiumSlot player={ranked[1]} rank={1} height={75} medal={'\u{1F948}'} borderColor="#c0c0c0" />
            <PodiumSlot player={ranked[0]} rank={0} height={110} medal={'\u{1F451}'} borderColor="var(--gold)" />
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
                {p.total_wins}W {'\u00B7'} {p.total_losses}L
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', textAlign: 'right', minWidth: '36px' }}>
                {wp}%
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', width: '30px', textAlign: 'right' }}>{p.total_games}g</div>
            </div>
          )
        })}
      </div>

      {ranked.length > 0 && (
        <button onClick={() => shareLeaderboard({ players, period: tabLabels[tab] })} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--green-dim)', border: '1px solid var(--green-border)', color: 'var(--green2)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", marginBottom: '20px' }}>
          {'\u{1F4F2}'} Share Leaderboard
        </button>
      )}

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
