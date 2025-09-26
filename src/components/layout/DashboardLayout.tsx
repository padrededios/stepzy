'use client'

import { Header } from './Header'
import { Footer } from './Footer'

interface User {
  id: string
  email: string
  pseudo: string
  avatar?: string | null
  role: 'user' | 'root'
}

interface DashboardLayoutProps {
  user: User
  children: React.ReactNode
}

export function DashboardLayout({ user, children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col p-4 lg:p-6">
      {/* Container principal avec effet de page dans une page */}
      <div className="flex-1 max-w-7xl mx-auto w-full bg-white rounded-2xl shadow-2xl shadow-blue-900/10 border border-gray-100/50 overflow-hidden flex flex-col animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
        {/* Header */}
        <div className="flex-shrink-0">
          <Header user={user} />
        </div>

        {/* Main Content avec padding et scrolling */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 lg:p-6 xl:p-8">
            {children}
          </div>
        </main>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-gray-100">
          <Footer />
        </div>
      </div>

      {/* Éléments décoratifs en arrière-plan avec animations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-300/15 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-300/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/4 right-1/4 w-48 h-48 bg-green-300/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-1/4 left-1/4 w-56 h-56 bg-yellow-300/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>
    </div>
  )
}