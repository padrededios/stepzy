'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import NotificationCenter from '../notifications/NotificationCenter'

interface User {
  id: string
  email: string
  pseudo: string
  avatar?: string | null
  role: 'user' | 'root'
}

interface HeaderProps {
  user: User | null
  onMobileMenuToggle?: () => void
}

export function Header({ user, onMobileMenuToggle }: HeaderProps) {
  const router = useRouter()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = async () => {
    if (isLoggingOut) return

    setIsLoggingOut(true)
    setIsUserMenuOpen(false)

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Always redirect to login, even if logout request fails
      router.replace('/login')
      setIsLoggingOut(false)
    }
  }

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen)
  }

  const isAdmin = user?.role === 'root'

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and mobile menu button */}
          <div className="flex items-center">
            {user && (
              <button
                onClick={onMobileMenuToggle}
                className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Ouvrir le menu mobile"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            
            <Link
              href={user ? '/dashboard' : '/'}
              className="flex items-center ml-2 md:ml-0"
              aria-label="Accueil"
            >
              <div className="flex items-center">
                <div className="relative w-10 h-10">
                  <Image
                    src="/images/stepzy_logo.jpg"
                    alt="Stepzy Logo"
                    fill
                    className="rounded-lg object-cover"
                  />
                </div>
                <span className="ml-3 text-xl font-bold text-gray-900">
                  Stepzy
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation for desktop */}
          {user && (
            <nav className="hidden md:flex space-x-8">
              <Link
                href="/dashboard"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                Activités
              </Link>
              {isAdmin && (
                <Link 
                  href="/admin" 
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Administration
                </Link>
              )}
            </nav>
          )}

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Notification Center */}
                <NotificationCenter userId={user.id} />

                {/* User menu */}
                <div className="relative" ref={userMenuRef}>
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Ouvrir le menu utilisateur"
                >
                  <div className="relative w-8 h-8">
                    <Image
                      src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.pseudo)}&backgroundColor=b6e3f4,c0aede,d1d4f9&radius=50`}
                      alt="Avatar utilisateur"
                      fill
                      className="rounded-full object-cover"
                    />
                  </div>
                  <span className="hidden md:block text-sm font-medium text-gray-700">
                    {user.pseudo}
                  </span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* User dropdown menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user.pseudo}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        {isAdmin && (
                          <span className="inline-block mt-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            Administrateur
                          </span>
                        )}
                      </div>
                      
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Profil
                      </Link>
                      
                      <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoggingOut ? 'Déconnexion...' : 'Se déconnecter'}
                      </button>
                    </div>
                  </div>
                )}
                </div>
              </>
            ) : (
              /* Guest buttons */
              <div className="flex items-center space-x-4">
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium"
                >
                  Se connecter
                </Link>
                <Link
                  href="/register"
                  className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  S'inscrire
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile navigation menu */}
      {user && (
        <div className="md:hidden">
          <div role="navigation" aria-label="Menu mobile" className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
            <Link
              href="/dashboard"
              className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
            >
              Activités
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
              >
                Administration
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}