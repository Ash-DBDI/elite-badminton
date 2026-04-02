import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const Ctx = createContext()

const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN || '1234'

export function AppProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('ebs_theme') || 'dark')
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem('ebs_admin') === ADMIN_PIN)
  const [players, setPlayers] = useState([])
  const [activeSession, setActiveSession] = useState(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('ebs_theme', theme)
  }, [theme])

  useEffect(() => {
    loadPlayers()
    loadActiveSession()
  }, [])

  async function loadPlayers() {
    const { data } = await supabase
      .from('players').select('*').eq('active', true)
      .order('total_wins', { ascending: false })
    if (data) setPlayers(data)
  }

  async function loadActiveSession() {
    const { data } = await supabase
      .from('sessions')
      .select(`*, session_players(*, players(*)), games(*)`)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    setActiveSession(data || null)
  }

  function toggleTheme() {
    setTheme(t => t === 'dark' ? 'light' : 'dark')
  }

  function loginAdmin(pin) {
    if (pin === ADMIN_PIN) {
      sessionStorage.setItem('ebs_admin', pin)
      setIsAdmin(true)
      return true
    }
    return false
  }

  function logoutAdmin() {
    sessionStorage.removeItem('ebs_admin')
    setIsAdmin(false)
  }

  return (
    <Ctx.Provider value={{
      theme, toggleTheme,
      isAdmin, loginAdmin, logoutAdmin,
      players, loadPlayers,
      activeSession, setActiveSession, loadActiveSession
    }}>
      {children}
    </Ctx.Provider>
  )
}

export const useApp = () => useContext(Ctx)
