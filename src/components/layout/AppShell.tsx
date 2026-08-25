import { Outlet, useNavigate } from 'react-router-dom'
import { LOGIN_ROUTE } from '@/config/constants'
import { useAuth } from '@/hooks/useAuth'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

/** Chrome shared by every authenticated screen. */
export function AppShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  if (!user) return null

  const handleLogout = () => {
    void logout().then(() => navigate(LOGIN_ROUTE, { replace: true }))
  }

  return (
    <div className="flex min-h-svh bg-background">
      <Sidebar role={user.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} onLogout={handleLogout} />
        <main className="flex-1 overflow-x-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
