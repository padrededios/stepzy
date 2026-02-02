'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { Header } from './Header'
import { Footer } from './Footer'
import { CurrentUserContext } from '@/hooks/useCurrentUser'
import { NotificationsProvider } from '@/contexts/NotificationsContext'
import { ChatProvider } from '@/contexts/ChatContext'
import { User } from '@/types'


interface DashboardLayoutProps {
  user: User
  children: React.ReactNode
}

export function DashboardLayout({ user, children }: DashboardLayoutProps) {
  const pathname = usePathname()

  // Reset scroll to top quand on change de page
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return (
    <CurrentUserContext.Provider value={user}>
      <NotificationsProvider>
        <ChatProvider>
          <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
            {/* Container principal style MPG */}
            <div className="flex-1 w-full flex flex-col">
              {/* Header - Fixed at top */}
              <div className="fixed top-0 left-0 right-0 z-50">
                <Header user={user} />
              </div>

              {/* Main Content - With padding for fixed header and footer */}
              <main className="flex-1 relative mt-16 mb-10">
                <div className="max-w-7xl mx-auto px-4 py-6 lg:px-6 lg:py-8">
                  {children}
                </div>
              </main>

              {/* Footer - Fixed at bottom */}
              <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200">
                <Footer />
              </div>
            </div>
          </div>
        </ChatProvider>
      </NotificationsProvider>
    </CurrentUserContext.Provider>
  )
}