import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { SessionProvider } from './context/SessionContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import SessionSetup from './pages/SessionSetup'
import LiveSession from './pages/LiveSession'
import SessionEnd from './pages/SessionEnd'
import Leaderboard from './pages/Leaderboard'
import Players from './pages/Players'
import PlayerProfile from './pages/PlayerProfile'
import History from './pages/History'

export default function App() {
  return (
    <ThemeProvider>
      <SessionProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/session" element={<SessionSetup />} />
              <Route path="/live" element={<LiveSession />} />
              <Route path="/session-end" element={<SessionEnd />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/players" element={<Players />} />
              <Route path="/player/:id" element={<PlayerProfile />} />
              <Route path="/history" element={<History />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </SessionProvider>
    </ThemeProvider>
  )
}
