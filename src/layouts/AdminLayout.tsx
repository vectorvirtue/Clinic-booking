import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '../components/Sidebar'
import { Topbar } from '../components/Topbar'

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-slate-800">
      {sidebarOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-slate-950/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      <main className="min-h-screen md:ml-[260px]">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <Outlet />
      </main>
    </div>
  )
}
