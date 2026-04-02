import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const SessionContext = createContext()

export function SessionProvider({ children }) {
  const [activeSession, setActiveSession] = useState(null)
  const [sessionPlayers, setSessionPlayers] = useState([])
  const [games, setGames] = useState([])
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchPlayers = useCallback(async () => {
    const { data } = await supabase.from('players').select('*').eq('active', true).order('skill_rating', { ascending: false })
    if (data) setPlayers(data)
  }, [])

  const fetchActiveSession = useCallback(async () => {
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .in('status', ['setup', 'active'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    setActiveSession(data)
    if (data) {
      const { data: sp } = await supabase.from('session_players').select('*').eq('session_id', data.id)
      setSessionPlayers(sp || [])
      const { data: g } = await supabase.from('games').select('*').eq('session_id', data.id).order('game_number')
      setGames(g || [])
    } else {
      setSessionPlayers([])
      setGames([])
    }
  }, [])

  useEffect(() => {
    Promise.all([fetchPlayers(), fetchActiveSession()]).then(() => setLoading(false))
  }, [fetchPlayers, fetchActiveSession])

  useEffect(() => {
    const channel = supabase.channel('realtime-session')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => fetchActiveSession())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_players' }, () => fetchActiveSession())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, () => fetchActiveSession())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => fetchPlayers())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchActiveSession, fetchPlayers])

  const createSession = async (duration = 120) => {
    const { data, error } = await supabase.from('sessions').insert({ duration_minutes: duration }).select().single()
    if (error) throw error
    setActiveSession(data)
    return data
  }

  const addPlayerToSession = async (sessionId, playerId, status = 'here') => {
    await supabase.from('session_players').insert({ session_id: sessionId, player_id: playerId, status })
    await fetchActiveSession()
  }

  const removePlayerFromSession = async (sessionId, playerId) => {
    await supabase.from('session_players').delete().eq('session_id', sessionId).eq('player_id', playerId)
    await fetchActiveSession()
  }

  const updatePlayerStatus = async (sessionPlayerId, status) => {
    const updates = { status }
    if (status === 'here' || status === 'arrived') updates.arrived_at = new Date().toISOString()
    await supabase.from('session_players').update(updates).eq('id', sessionPlayerId)
    await fetchActiveSession()
  }

  const startSession = async (sessionId) => {
    await supabase.from('sessions').update({ status: 'active' }).eq('id', sessionId)
    await fetchActiveSession()
  }

  const addGame = async (sessionId, gameData) => {
    const { data, error } = await supabase.from('games').insert({ session_id: sessionId, ...gameData }).select().single()
    if (error) throw error
    await fetchActiveSession()
    return data
  }

  const submitScore = async (gameId, teamAScore, teamBScore) => {
    await supabase.from('games').update({
      team_a_score: teamAScore,
      team_b_score: teamBScore,
      status: 'completed',
      completed_at: new Date().toISOString()
    }).eq('id', gameId)
    await fetchActiveSession()
  }

  const endSession = async (sessionId, potdId) => {
    await supabase.from('sessions').update({
      status: 'completed',
      player_of_day: potdId,
      completed_at: new Date().toISOString()
    }).eq('id', sessionId)
    setActiveSession(null)
    setSessionPlayers([])
    setGames([])
  }

  const saveBadges = async (badges) => {
    if (badges.length === 0) return
    await supabase.from('badges').insert(badges)
  }

  const updatePlayerStats = async (playerId, stats) => {
    await supabase.from('players').update(stats).eq('id', playerId)
    await fetchPlayers()
  }

  return (
    <SessionContext.Provider value={{
      activeSession, sessionPlayers, games, players, loading,
      createSession, addPlayerToSession, removePlayerFromSession,
      updatePlayerStatus, startSession, addGame, submitScore,
      endSession, saveBadges, updatePlayerStats, fetchPlayers,
      fetchActiveSession, setGames
    }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  return useContext(SessionContext)
}
