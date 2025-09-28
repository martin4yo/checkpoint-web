'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Users, MapPin, CheckSquare, LogOut } from 'lucide-react'

export default function Navigation() {
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const navItems = [
    { href: '/', label: 'Checkpoints', icon: CheckSquare },
    { href: '/users', label: 'Usuarios', icon: Users },
    { href: '/places', label: 'Lugares', icon: MapPin },
  ]

  return (
    <nav className="bg-white border-r border-gray-200 w-64 min-h-screen">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-black">Checkpoint</h1>
        <p className="text-sm text-gray-600">Panel Admin</p>
      </div>

      <div className="px-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`w-full flex items-center px-4 py-3 mb-2 rounded-xl text-left transition-colors ${
                isActive
                  ? 'bg-black text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon size={20} className="mr-3" />
              {item.label}
            </button>
          )
        })}
      </div>

      <div className="absolute bottom-6 left-4 right-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <LogOut size={20} className="mr-3" />
          Cerrar sesión
        </button>
      </div>
    </nav>
  )
}