'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import NotificationCenter from '../notifications/NotificationCenter'
import { User } from '@/types'


interface HeaderProps {
  user: User | null
}

export function Header({ user }: HeaderProps) {
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
      // Logout error - will still redirect to login
    } finally {
      // Always redirect to login, even if logout request fails
      router.replace('/login')
      setIsLoggingOut(false)
    }
  }

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen)
  }

  const handleNotificationsClick = () => {
    // TODO: Implémenter l'ouverture du panneau de notifications
  }

  const handleSettingsClick = () => {
    // TODO: Rediriger vers la page des paramètres
    router.push('/settings')
  }

  const handleMessagesClick = () => {
    // TODO: Rediriger vers la page des messages
    router.push('/messages')
  }

  return (
    <header className="bg-gradient-to-r from-blue-400 to-blue-600 shadow-lg rounded-t-2xl">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-16 relative">
          {/* Conteneur unifié - tout centré ensemble */}
          <div className="flex items-center space-x-6">
            {/* Logo sans fond pour transparence totale */}
            <Link
              href={user ? '/mes-activites' : '/'}
              className="flex items-center rounded-full px-4 py-2 hover:bg-white hover:bg-opacity-10 transition-colors"
              aria-label="Accueil"
            >
              <div className="flex items-center">
                <div className="relative w-8 h-8">
                  <Image
                    src="/images/stepzy_logo.jpg"
                    alt="Stepzy Logo"
                    fill
                    className="rounded-lg object-cover"
                  />
                </div>
                <span className="ml-2 text-lg font-bold text-white">
                  Stepzy
                </span>
              </div>
            </Link>

            {/* Navigation pour desktop sans fond pour transparence totale */}
            {user && (
              <nav className="hidden md:flex rounded-full px-4 py-2">
                <div className="flex space-x-4">
                  <Link
                    href="/mes-activites"
                    className="text-white hover:text-blue-200 px-3 py-1 text-sm font-medium transition-colors rounded-full hover:bg-white hover:bg-opacity-10"
                  >
                    Mes activités
                  </Link>
                  <Link
                    href="/s-inscrire"
                    className="text-white hover:text-blue-200 px-3 py-1 text-sm font-medium transition-colors rounded-full hover:bg-white hover:bg-opacity-10"
                  >
                    S'inscrire
                  </Link>
                  <Link
                    href="/mes-statistiques"
                    className="text-white hover:text-blue-200 px-3 py-1 text-sm font-medium transition-colors rounded-full hover:bg-white hover:bg-opacity-10"
                  >
                    Mes statistiques
                  </Link>
                </div>
              </nav>
            )}

            {/* Section droite sans fond pour transparence totale */}
            {user ? (
              <div className="flex items-center rounded-full px-4 py-2">
                  {/* User info - clickable avec position relative pour le dropdown */}
                  <div className="relative">
                    <button
                      onClick={toggleUserMenu}
                      className="hover:bg-white hover:bg-opacity-10 rounded-full p-1 transition-colors mr-3"
                    >
                      <div className="relative w-8 h-8">
                        <Image
                          src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.pseudo)}&backgroundColor=b6e3f4,c0aede,d1d4f9&radius=50`}
                          alt="Avatar utilisateur"
                          fill
                          className="rounded-full object-cover"
                        />
                      </div>
                    </button>

                    {/* User dropdown menu - positionné sous l'avatar */}
                    {isUserMenuOpen && (
                      <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50" ref={userMenuRef}>
                        <div className="py-1">
                          <div className="px-4 py-2 border-b border-gray-100">
                            <p className="text-sm font-medium text-gray-900">{user.pseudo}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>

                          <Link
                            href="/profile"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Mon Profil
                          </Link>

                          <button
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                          >
                            <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            {isLoggingOut ? 'Déconnexion...' : 'Se déconnecter'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Icons avec espacement réduit */}
                  <div className="flex items-center space-x-1">
                    {/* Notifications with badge */}
                    <div className="relative">
                      <button
                        onClick={handleNotificationsClick}
                        className="p-1.5 text-white hover:bg-white hover:bg-opacity-10 rounded-full transition-colors w-8 h-8 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                        title="Notifications"
                      >
                        🔔
                      </button>
                      {/* Notification badge */}
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold pointer-events-none">
                        3
                      </div>
                    </div>

                    {/* Settings */}
                    <button
                      onClick={handleSettingsClick}
                      className="p-1.5 text-white hover:bg-white hover:bg-opacity-10 rounded-full transition-colors w-8 h-8 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                      title="Paramètres"
                    >
                      ⚙️
                    </button>

                    {/* Messages */}
                    <button
                      onClick={handleMessagesClick}
                      className="p-1.5 text-white hover:bg-white hover:bg-opacity-10 rounded-full transition-colors w-8 h-8 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                      title="Messages"
                    >
                      💬
                    </button>
                  </div>
              </div>
            ) : (
              /* Guest buttons */
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="text-white hover:text-blue-200 px-3 py-2 text-sm font-medium"
                >
                  Se connecter
                </Link>
                <Link
                  href="/register"
                  className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  S'inscrire
                </Link>
              </div>
            )}
          </div>

          {/* Mobile user menu button - position absolue */}
          {user && (
            <button
              onClick={toggleUserMenu}
              className="absolute right-4 p-2 text-white hover:bg-white hover:bg-opacity-10 rounded-full transition-colors md:hidden"
              aria-label="Ouvrir le menu utilisateur"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>


      {/* Mobile navigation menu */}
      {user && (
        <div className="md:hidden">
          <div role="navigation" aria-label="Menu mobile" className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-blue-300">
            <Link
              href="/mes-activites"
              className="block px-3 py-2 text-base font-medium text-white hover:text-blue-200 hover:bg-white hover:bg-opacity-10 rounded-md"
            >
              Mes activités
            </Link>
            <Link
              href="/s-inscrire"
              className="block px-3 py-2 text-base font-medium text-white hover:text-blue-200 hover:bg-white hover:bg-opacity-10 rounded-md"
            >
              S'inscrire
            </Link>
            <Link
              href="/mes-statistiques"
              className="block px-3 py-2 text-base font-medium text-white hover:text-blue-200 hover:bg-white hover:bg-opacity-10 rounded-md"
            >
              Mes statistiques
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}