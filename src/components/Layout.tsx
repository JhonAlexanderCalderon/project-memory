import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import QuickCapture from './QuickCapture'

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Outlet />
      <QuickCapture />
      <BottomNav />
    </div>
  )
}
