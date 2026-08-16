import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuthContext } from './lib/AuthContext'
import { CaptureProvider } from './lib/CaptureContext'
import { ProjectsProvider } from './lib/ProjectsContext'
import { isFirebaseConfigured } from './lib/firebase'
import Layout from './components/Layout'
import Login from './pages/Login'
import SetupNeeded from './pages/SetupNeeded'
import Home from './pages/Home'
import Inbox from './pages/Inbox'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Search from './pages/Search'
import Settings from './pages/Settings'

function Gate() {
  const { user, loading } = useAuthContext()

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-slate-500">Loading…</div>
  }

  if (!user) return <Login />

  return (
    <ProjectsProvider>
      <CaptureProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/search" element={<Search />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </CaptureProvider>
    </ProjectsProvider>
  )
}

export default function App() {
  if (!isFirebaseConfigured) return <SetupNeeded />

  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
}
