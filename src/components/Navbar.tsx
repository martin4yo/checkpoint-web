'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, MapPin, Users, CheckCircle, Link as LinkIcon, LogOut, Bell, FileBarChart, Building2 } from 'lucide-react'
import { useTenant } from '@/contexts/TenantContext'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { currentUser, selectedTenantId, tenants, setSelectedTenantId } = useTenant()

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
    { href: '/push-devices', label: 'Notificaciones', icon: Bell },
  ]

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-2xl font-bold text-black">
                Checkpoint
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => {
                const IconComponent = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                      pathname === item.href
                        ? 'border-black text-black'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <IconComponent className="mr-2 h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Tenant Selector - Only for Superusers */}
            {currentUser?.superuser && tenants.length > 0 && (
              <div className="relative">
                <div className="flex items-center">
                  <Building2 className="h-4 w-4 text-gray-500 mr-2" />
                  <select
                    value={selectedTenantId || ''}
                    onChange={(e) => setSelectedTenantId(e.target.value || null)}
                    className="block w-48 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white"
                  >
                    {tenants.map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="inline-flex items-center bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}