'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
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
  Tag
} from 'lucide-react'

const MapMarkerIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-6 h-6 text-red-500"
  >
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  </svg>
)

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

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
          fixed top-0 left-0 h-full bg-white shadow-lg border-r border-gray-200 z-50 transition-all duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
          ${isCollapsed ? 'w-16' : 'w-64'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!isCollapsed ? (
            <Link href="/" className="flex items-center text-xl font-bold text-black" onClick={closeMobile}>
              <MapMarkerIcon />
              <span className="ml-2">Checkpoint</span>
            </Link>
          ) : (
            <Link href="/" className="flex items-center justify-center w-full" onClick={closeMobile}>
              <MapMarkerIcon />
            </Link>
          )}

          {/* Collapse button (desktop only) */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-md hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft
              className={`h-5 w-5 text-gray-600 transition-transform duration-200 ${
                isCollapsed ? 'rotate-180' : ''
              }`}
            />
          </button>
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
                        ? 'bg-black text-white'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }
                    `}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <IconComponent
                      className={`h-5 w-5 flex-shrink-0 ${
                        isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'
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

        {/* Footer - Logout Button */}
        <div className="border-t border-gray-200 p-3">
          <button
            onClick={handleLogout}
            className={`
              flex items-center w-full px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg
              hover:bg-red-50 hover:text-red-700 transition-colors group
            `}
            title={isCollapsed ? 'Cerrar Sesión' : undefined}
          >
            <LogOut className="h-5 w-5 flex-shrink-0 text-gray-500 group-hover:text-red-600" />
            {!isCollapsed && (
              <span className="ml-3 truncate">Cerrar Sesión</span>
            )}
          </button>
        </div>
      </div>

      {/* Sidebar spacer for desktop */}
      <div className={`hidden lg:block transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`} />
    </>
  )
}