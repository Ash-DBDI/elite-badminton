import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Nav from './components/Nav'
import ActiveSession from './screens/ActiveSession'
import Schedule from './screens/Schedule'
import Players from './screens/Players'
import Admin from './screens/Admin'
import Stats from './screens/Stats'
import History from './screens/History'
import PlayerDetail from './screens/PlayerDetail'
import SessionEnd from './screens/SessionEnd'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<><ActiveSession /><Nav /></>} />
          <Route path="/schedule" element={<><Schedule /><Nav /></>} />
          <Route path="/players" element={<><Players /><Nav /></>} />
          <Route path="/players/:id" element={<><PlayerDetail /><Nav /></>} />
          <Route path="/admin" element={<><Admin /><Nav /></>} />
          <Route path="/stats" element={<><Stats /><Nav /></>} />
          <Route path="/history" element={<><History /><Nav /></>} />
          <Route path="/session-end" element={<><SessionEnd /><Nav /></>} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}
