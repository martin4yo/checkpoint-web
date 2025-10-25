'use client'

import Sidebar from './Sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
  titleIcon?: React.ReactNode
}

export default function DashboardLayout({ children, title, titleIcon }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden">
        <div className="py-6 px-6 lg:px-8 lg:pt-6 pt-16">
          {title && (
            <div className="mb-6 flex items-center">
              {titleIcon && (
                <div className="mr-3 w-10 h-10 bg-palette-yellow rounded-lg flex items-center justify-center">
                  <div className="text-palette-dark">{titleIcon}</div>
                </div>
              )}
              <h1 className="text-3xl font-bold text-palette-dark">{title}</h1>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  )
}