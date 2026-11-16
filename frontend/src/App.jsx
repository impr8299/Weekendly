import { Routes, Route, Navigate } from 'react-router-dom'
import WaitlistPage from './pages/WaitlistPage.jsx'
import TeamPage from './pages/TeamPage.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<WaitlistPage />} />
      <Route path="/team" element={<TeamPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
