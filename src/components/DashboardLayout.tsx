'use client'

import Sidebar from './Sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 lg:pt-6 pt-16">
          {title && (
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  )
}