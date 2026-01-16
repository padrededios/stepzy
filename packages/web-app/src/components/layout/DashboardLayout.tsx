'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { Header } from './Header'
import { Footer } from './Footer'
import { CurrentUserContext } from '@/hooks/useCurrentUser'
import { User } from '@/types'


interface DashboardLayoutProps {
  user: User
  children: React.ReactNode
}

export function DashboardLayout({ user, children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const mainRef = useRef<HTMLElement>(null)

  // Reset scroll to top quand on change de page
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [pathname])

  return (
    <CurrentUserContext.Provider value={user}>
    <div className="fixed inset-0 bg-[#f5f5f5] flex flex-col">
      {/* Container principal style MPG */}
      <div className="flex-1 w-full flex flex-col">
        {/* Header fixe */}
        <div className="flex-shrink-0">
          <Header user={user} />
        </div>

        {/* Main Content avec scrolling */}
        <main
          ref={mainRef}
          className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth hide-scrollbar"
        >
          <div className="max-w-7xl mx-auto px-4 py-6 lg:px-6 lg:py-8">
            {children}
          </div>
        </main>

        {/* Footer fixe */}
        <div className="flex-shrink-0 border-t border-gray-200">
          <Footer />
        </div>
      </div>
    </div>
    </CurrentUserContext.Provider>
  )
}