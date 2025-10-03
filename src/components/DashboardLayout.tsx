'use client'

import Sidebar from './Sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
  titleIcon?: React.ReactNode
}

export default function DashboardLayout({ children, title, titleIcon }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden lg:ml-64">
        <div className="py-6 px-8 lg:px-12 lg:pt-6 pt-16">
          {title && (
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                {titleIcon && titleIcon}
                <span>{title}</span>
              </h1>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  )
}