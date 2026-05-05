import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useState, useEffect } from 'react'
import { alertesService } from '../../services'
import {
  LayoutDashboard, Car, Users, Fuel, BarChart3,
  Bell, LogOut, Menu, UserCog
} from 'lucide-react'
import logoCipres from '../../assets/logo-cipres.png'

const navItems = [
  { to: '/dashboard',   label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/vehicules',   label: 'Véhicules',        icon: Car },
  { to: '/conducteurs', label: 'Conducteurs',      icon: Users },
  { to: '/pleins',      label: 'Pleins carburant',  icon: Fuel },
  { to: '/rapports',    label: 'Rapports',          icon: BarChart3 },
  { to: '/alertes',     label: 'Alertes',           icon: Bell },
]

const adminNavItems = [
  { to: '/utilisateurs', label: 'Utilisateurs', icon: UserCog },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [alertCount, setAlertCount] = useState(0)

  useEffect(() => {
    alertesService.count().then(r => setAlertCount(r.data.non_lues)).catch(() => {})
    const interval = setInterval(() => {
      alertesService.count().then(r => setAlertCount(r.data.non_lues)).catch(() => {})
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = () => { logout(); navigate('/login') }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="bg-cipres-600 px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <img src={logoCipres} alt="CIPRES" className="w-10 h-10 object-contain" />
          <div>
            <span className="text-white font-bold text-lg leading-none">ParcAuto</span>
            <p className="text-cipres-200 text-xs mt-0.5">Gestion du parc — CIPRES</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-cipres-600 text-white shadow-sm'
                  : 'text-cipres-200 hover:bg-cipres-800 hover:text-white'
              }`
            }
          >
            <Icon size={18} className="flex-shrink-0" />
            <span className="flex-1">{label}</span>
            {to === '/alertes' && alertCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {alertCount > 9 ? '9+' : alertCount}
              </span>
            )}
          </NavLink>
        ))}

        {user?.role === 'admin' && (
          <>
            <div className="pt-3 pb-1 px-3">
              <p className="text-xs font-semibold text-cipres-500 uppercase tracking-wider">Administration</p>
            </div>
            {adminNavItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-cipres-600 text-white shadow-sm'
                      : 'text-cipres-200 hover:bg-cipres-800 hover:text-white'
                  }`
                }
              >
                <Icon size={18} className="flex-shrink-0" />
                <span className="flex-1">{label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Utilisateur */}
      <div className="border-t border-cipres-800 px-3 py-4 flex-shrink-0">
        <div className="flex items-center gap-3 px-3 py-2 mb-1 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-cipres-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.prenom?.[0]}{user?.nom?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">{user?.prenom} {user?.nom}</p>
            <p className="text-cipres-300 text-xs truncate capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 text-cipres-300 hover:text-white hover:bg-cipres-800 rounded-lg text-sm transition-colors"
        >
          <LogOut size={16} />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-cipres-50">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex md:w-60 bg-cipres-900 flex-col flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Sidebar mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed left-0 top-0 bottom-0 w-60 bg-cipres-900 z-50 flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header mobile */}
        <header className="md:hidden bg-cipres-600 px-4 py-3 flex items-center gap-3 shadow-md">
          <button onClick={() => setSidebarOpen(true)} className="text-white">
            <Menu size={22} />
          </button>
          <img src={logoCipres} alt="CIPRES" className="w-7 h-7 object-contain" />
          <span className="font-bold text-white">ParcAuto</span>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}