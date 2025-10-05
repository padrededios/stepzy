'use client'

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import { usePathname } from 'next/navigation'

interface LayoutContextType {
  isTransitioning: boolean
  scrollToTop: () => void
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined)

export function useLayout() {
  const context = useContext(LayoutContext)
  if (!context) {
    throw new Error('useLayout must be used within LayoutProvider')
  }
  return context
}

interface LayoutProviderProps {
  children: ReactNode
}

export function LayoutProvider({ children }: LayoutProviderProps) {
  const pathname = usePathname()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const mainRef = useRef<HTMLDivElement>(null)

  // Gestion des transitions de page
  useEffect(() => {
    setIsTransitioning(true)

    // Scroll to top lors du changement de page
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const timer = setTimeout(() => setIsTransitioning(false), 300)
    return () => clearTimeout(timer)
  }, [pathname])

  const scrollToTop = () => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <LayoutContext.Provider value={{ isTransitioning, scrollToTop }}>
      {children}
    </LayoutContext.Provider>
  )
}