import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'
import { shareSessionSummary } from '../lib/whatsapp'
import EBSLogo from '../components/EBSLogo'
import Avatar from '../components/Avatar'

const BADGE_DEFS = {
  HOT_HAND: { icon: '\u{1F525}', label: 'Hot Hand' }, LIGHTNING: { icon: '\u{26A1}', label: 'Lightning' },
  COMEBACK: { icon: '\u{1F4AA}', label: 'Comeback' }, THE_WALL: { icon: '\u{1F9F1}', label: 'The Wall' },
  SHARP_SHOOTER: { icon: '\u{1F3AF}', label: 'Sharp Shooter' }, POTD: { icon: '\u{1F451}', label: 'POTD' },
  BEST_DUO: { icon: '\u{1F91D}', label: 'Best Duo' }, MOST_IMPROVED: { icon: '\u{1F4C8}', label: 'Most Improved' },
  IRON_MAN: { icon: '\u{1F9BE}', label: 'Iron Man' }, FIRST_BLOOD: { icon: '\u{1FA78}', label: 'First Blood' },
}

export default function SessionEnd() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { players } = useApp()
  const [visibleBadges, setVisibleBadges] = useState(0)

  const potd = state?.potdPlayer
  const badges = state?.newBadges || []
  const stats = state?.sessionStats || []
  const sessionId = state?.sessionId
  const games = state?.games || []
  const sessionDate = state?.sessionDate || ''

  // Animate badges appearing one by one
  useEffect(() => {
    if (badges.length === 0) return
    const timer = setInterval(() => {
      setVisibleBadges(v => { if (v >= badges.length) { clearInterval(timer); return v } return v + 1 })
    }, 400)
    return () => clearInterval(timer)
  }, [badges.length])

  const P = (id) => players.find(p => p.id === id) || { name: '?', initials: '??', avatar_id: 0 }

  // Sort session stats by performance
  const ranked = [...stats].sort((a, b) => {
    const sa = a.games_won * 3 + (a.points_scored - a.points_conceded) * 0.1
    const sb = b.games_won * 3 + (b.points_scored - b.points_conceded) * 0.1
    return sb - sa
  })

  const potdRecord = potd && stats.find(s => s.player_id === potd.id)
  const potdRecStr = potdRecord ? `${potdRecord.games_won}W \u00B7 ${potdRecord.games_played - potdRecord.games_won}L \u00B7 ${potdRecord.points_scored - potdRecord.points_conceded > 0 ? '+' : ''}${potdRecord.points_scored - potdRecord.points_conceded} pts` : ''

  function handleShare() {
    const potdBadges = badges.filter(b => b.player_id === potd?.id).map(b => BADGE_DEFS[b.badge_type]).filter(Boolean)
    shareSessionSummary({ games, players, potdName: potd?.name || 'N/A', potdRecord: potdRecStr, potdBadges, sessionDate, totalGames: games.filter(g => g.status === 'completed').length })
  }

  if (!sessionId) {
    return (
      <div className="screen" style={{ padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>{'\u{1F3F8}'}</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '20px' }}>No session data</div>
        <button onClick={() => navigate('/')} style={{ marginTop: '20px', padding: '12px 24px', borderRadius: '10px', background: 'var(--gold)', border: 'none', color: '#111', fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Go Home</button>
      </div>
    )
  }

  return (
    <div className="screen" style={{ padding: '24px 16px 90px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ margin: '0 auto 12px', width: 'fit-content' }}><EBSLogo size={48} /></div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '28px', fontWeight: 300, color: 'var(--gold)', marginBottom: '4px' }}>Session Complete</div>
        <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{sessionDate} {'\u00B7'} {games.filter(g => g.status === 'completed').length} games</div>
      </div>

      {/* POTD Reveal */}
      {potd && (
        <div style={{
          background: 'linear-gradient(135deg, #1a1208 0%, #2a1e08 25%, #1a1208 50%, #2a2010 75%, #1a1208 100%)',
          backgroundSize: '200% 200%', animation: 'shimmer 3s ease infinite',
          borderRadius: '20px', border: '2px solid var(--gold-border)', padding: '28px 20px',
          textAlign: 'center', marginBottom: '20px', boxShadow: '0 4px 30px rgba(201,168,76,0.15)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '8px', animation: 'crownFloat 3s ease-in-out infinite' }}>{'\u{1F451}'}</div>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--gold)', fontWeight: 700, marginBottom: '12px' }}>Player of the Day</div>
          <Avatar initials={potd.initials} size={80} index={players.indexOf(potd)} avatarId={potd.avatar_id} style={{ margin: '0 auto 12px' }} />
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '36px', fontWeight: 400, color: 'var(--gold)', marginBottom: '6px' }}>{potd.name}</div>
          <div style={{ fontSize: '14px', color: 'var(--muted)' }}>{potdRecStr}</div>
        </div>
      )}

      {/* Badges */}
      {badges.length > 0 && (
        <div style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', padding: '16px', marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>Badges Earned</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {badges.slice(0, visibleBadges).map((b, i) => {
              const def = BADGE_DEFS[b.badge_type]
              const p = P(b.player_id)
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '10px', background: 'var(--gold-dim)', animation: 'badgePop 0.4s ease' }}>
                  <span style={{ fontSize: '24px' }}>{def?.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{def?.label}</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{p.name}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Game Results */}
      {games.filter(g => g.status === 'completed').length > 0 && (
        <div style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', padding: '16px', marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>Results</div>
          {games.filter(g => g.status === 'completed').sort((a, b) => a.game_number - b.game_number).map(g => {
            const aWon = g.team_a_score > g.team_b_score
            return (
              <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 0', fontSize: '12px', borderTop: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--muted)', fontWeight: 700, minWidth: '22px' }}>G{g.game_number}</span>
                <span style={{ flex: 1, fontWeight: aWon ? 600 : 400, color: aWon ? 'var(--gold)' : 'var(--text)' }}>{P(g.team_a_player1).name} & {P(g.team_a_player2).name}</span>
                <span style={{ fontWeight: 700, minWidth: '45px', textAlign: 'center' }}>{g.team_a_score}\u2013{g.team_b_score}</span>
                <span style={{ flex: 1, fontWeight: !aWon ? 600 : 400, color: !aWon ? 'var(--gold)' : 'var(--text)', textAlign: 'right' }}>{P(g.team_b_player1).name} & {P(g.team_b_player2).name}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Player Rankings */}
      {ranked.length > 0 && (
        <div style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', padding: '16px', marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>Session Rankings</div>
          {ranked.filter(s => s.games_played > 0).map((s, i) => {
            const p = P(s.player_id)
            const diff = s.points_scored - s.points_conceded
            return (
              <div key={s.player_id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
                <span style={{ width: '18px', fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}>{i + 1}</span>
                <Avatar initials={p.initials} size={26} index={players.indexOf(p)} avatarId={p.avatar_id} />
                <span style={{ flex: 1, fontSize: '12px', fontWeight: 500 }}>{p.name}</span>
                <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{s.games_won}W {'\u00B7'} {s.games_played - s.games_won}L</span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: diff >= 0 ? 'var(--green2)' : 'var(--red)', minWidth: '30px', textAlign: 'right' }}>{diff > 0 ? '+' : ''}{diff}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Share */}
      <button onClick={handleShare} style={{ width: '100%', padding: '16px', borderRadius: '12px', background: '#25D366', border: 'none', color: '#fff', fontWeight: 700, fontSize: '15px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        {'\u{1F4F2}'} Share Session on WhatsApp
      </button>

      {/* Home */}
      <button onClick={() => navigate('/')} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--gold)', border: 'none', color: '#111', fontWeight: 700, fontSize: '14px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
        Back to Home
      </button>
    </div>
  )
}
