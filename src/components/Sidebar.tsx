'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  Home,
  MapPin,
  Users,
  CheckCircle,
  Link as LinkIcon,
  LogOut,
  Bell,
  FileBarChart,
  Menu,
  X,
  ChevronLeft,
  Building2,
  FileText,
  Tag,
  User
} from 'lucide-react'

interface Tenant {
  id: string
  name: string
  slug: string
}

interface CurrentUser {
  id: string
  name: string
  email: string
  superuser: boolean
  authorizesNovelties: boolean
  tenant: Tenant
}

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)

  useEffect(() => {
    // Only fetch user if not on login page
    if (pathname !== '/login') {
      fetchCurrentUser()
    }
  }, [pathname])

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setCurrentUser(data)
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  const navItems = [
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/places', label: 'Lugares', icon: MapPin },
    { href: '/users', label: 'Usuarios', icon: Users },
    { href: '/checkpoints', label: 'Checkpoints', icon: CheckCircle },
    { href: '/journey-reports', label: 'Reporte Jornadas', icon: FileBarChart },
    { href: '/assignments', label: 'Asignaciones', icon: LinkIcon },
    { href: '/novelties', label: 'Novedades', icon: FileText },
    { href: '/novelty-types', label: 'Tipos de Novedades', icon: Tag },
    { href: '/push-devices', label: 'Notificaciones', icon: Bell },
    { href: '/tenants', label: 'Tenants', icon: Building2 },
  ]

  const closeMobile = () => setIsMobileOpen(false)

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Mobile hamburger button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 rounded-md bg-white shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          {isMobileOpen ? (
            <X className="h-6 w-6 text-gray-600" />
          ) : (
            <Menu className="h-6 w-6 text-gray-600" />
          )}
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 left-0 h-full bg-sidebar shadow-lg border-r border-sidebar-hover z-50 transition-all duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
          ${isCollapsed ? 'w-16' : 'w-64'}
        `}
      >
        {/* Header */}
        <div className="relative flex items-center justify-between p-4 border-b border-sidebar-hover">
          {!isCollapsed ? (
            <>
              <Link href="/" className="flex items-center space-x-2" onClick={closeMobile}>
                <img
                  src="/axioma_logo.png"
                  alt="Axioma"
                  width={120}
                  height={40}
                  className="object-contain"
                />
              </Link>

              {/* Collapse button (desktop only) - expanded state */}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:flex p-1.5 rounded-md hover:bg-sidebar-hover transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-primary transition-transform duration-200" />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center w-full space-y-2">
              <Link href="/" className="flex items-center justify-center" onClick={closeMobile}>
                <img
                  src="/axioma_logo.png"
                  alt="Axioma"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </Link>

              {/* Collapse button (desktop only) - collapsed state */}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:flex p-1 rounded-md hover:bg-sidebar-hover transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-primary transition-transform duration-200 rotate-180" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => {
              const IconComponent = item.icon
              const isActive = pathname === item.href

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={closeMobile}
                    className={`
                      flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors group
                      ${isActive
                        ? 'bg-sidebar-active text-text-white'
                        : 'text-primary hover:bg-sidebar-hover hover:text-text-white'
                      }
                    `}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <IconComponent
                      className={`h-5 w-5 flex-shrink-0 ${
                        isActive ? 'text-text-white' : 'text-accent group-hover:text-text-white'
                      }`}
                    />
                    {!isCollapsed && (
                      <span className="ml-3 truncate">{item.label}</span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer - User Info & Logout */}
        <div className="border-t border-sidebar-hover">
          {/* User Info */}
          {currentUser && (
            <div className={`p-3 border-b border-sidebar-hover ${isCollapsed ? 'flex justify-center' : ''}`}>
              {!isCollapsed ? (
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-secondary text-text-white flex items-center justify-center">
                      <User className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-white truncate">
                      {currentUser.name}
                    </p>
                    <p className="text-xs text-palette-cream truncate">
                      {currentUser.email}
                    </p>
                    <div className="flex items-center mt-1">
                      <Building2 className="h-3 w-3 text-accent mr-1" />
                      <p className="text-xs text-text-white truncate">
                        {currentUser.tenant.name}
                      </p>
                    </div>
                    {currentUser.superuser && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-text-white mt-1">
                        Superusuario
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-secondary text-text-white flex items-center justify-center" title={currentUser.name}>
                  <User className="h-5 w-5" />
                </div>
              )}
            </div>
          )}

          {/* Logout Button */}
          <div className="p-3">
            <button
              onClick={handleLogout}
              className={`
                flex items-center w-full px-3 py-2.5 text-sm font-medium text-text-white rounded-lg
                hover:bg-danger hover:text-text-white transition-colors group
              `}
              title={isCollapsed ? 'Cerrar Sesión' : undefined}
            >
              <LogOut className="h-5 w-5 flex-shrink-0 text-text-white group-hover:text-text-white" />
              {!isCollapsed && (
                <span className="ml-3 truncate">Cerrar Sesión</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar spacer for desktop */}
      <div className={`hidden lg:block transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`} />
    </>
  )
}