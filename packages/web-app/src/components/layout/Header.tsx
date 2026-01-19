'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import NotificationCenter from '../notifications/NotificationCenter'
import { User } from '@/types'
import { authApi } from '@/lib/api'


interface HeaderProps {
  user: User | null
}

export function Header({ user }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const isActivePath = (path: string) => pathname === path

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
      await authApi.signOut()
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
    <header className="bg-gray-800 shadow-lg">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Section gauche : Logo + Navigation */}
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <Link
              href={user ? '/mes-sessions' : '/'}
              className="flex items-center hover:opacity-90 transition-opacity"
              aria-label="Accueil"
            >
              <div className="relative w-14 h-14">
                <Image
                  src="/images/stepzy_logo.png"
                  alt="Stepzy Logo"
                  fill
                  className="rounded-lg object-cover"
                />
              </div>
              <span className="ml-4 text-2xl font-extrabold text-white tracking-tight">
                Stepzy
              </span>
            </Link>

            {/* Navigation pour desktop */}
            {user && (
              <nav className="hidden md:flex">
                <div className="flex space-x-2">
                  <Link
                    href="/mes-sessions"
                    className={`relative text-white hover:text-gray-100 px-5 py-2.5 text-base font-semibold transition-colors rounded-md hover:bg-gray-700 ${
                      isActivePath('/mes-sessions') ? 'bg-gray-700' : ''
                    }`}
                  >
                    Mes sessions
                    {isActivePath('/mes-sessions') && (
                      <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    )}
                  </Link>
                  <Link
                    href="/mes-activites"
                    className={`relative text-white hover:text-gray-100 px-5 py-2.5 text-base font-semibold transition-colors rounded-md hover:bg-gray-700 ${
                      isActivePath('/mes-activites') ? 'bg-gray-700' : ''
                    }`}
                  >
                    Mes activités
                    {isActivePath('/mes-activites') && (
                      <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    )}
                  </Link>
                  <Link
                    href="/mes-statistiques"
                    className={`relative text-white hover:text-gray-100 px-5 py-2.5 text-base font-semibold transition-colors rounded-md hover:bg-gray-700 ${
                      isActivePath('/mes-statistiques') ? 'bg-gray-700' : ''
                    }`}
                  >
                    Mes statistiques
                    {isActivePath('/mes-statistiques') && (
                      <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    )}
                  </Link>
                </div>
              </nav>
            )}
          </div>

          {/* Section droite : Profil + Icônes */}
          {user ? (
              <div className="flex items-center space-x-3">
                  {/* Icons */}
                  <div className="hidden md:flex items-center space-x-1">
                    {/* Notifications with badge */}
                    <div className="relative">
                      <button
                        onClick={handleNotificationsClick}
                        className="p-2 text-white hover:bg-gray-700 rounded-full transition-colors"
                        title="Notifications"
                        aria-label="Notifications"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                      </button>
                      {/* Notification badge */}
                      <div className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold pointer-events-none">
                        3
                      </div>
                    </div>

                    {/* Settings */}
                    <button
                      onClick={handleSettingsClick}
                      className="p-2 text-white hover:bg-gray-700 rounded-full transition-colors"
                      title="Paramètres"
                      aria-label="Paramètres"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>

                    {/* Messages */}
                    <button
                      onClick={handleMessagesClick}
                      className="p-2 text-white hover:bg-gray-700 rounded-full transition-colors"
                      title="Messages"
                      aria-label="Messages"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </button>
                  </div>

                  {/* User menu button */}
                  <div className="relative">
                    <button
                      onClick={toggleUserMenu}
                      className="flex items-center space-x-2 hover:bg-gray-700 rounded-md px-3 py-2 transition-colors"
                    >
                      <div className="relative w-8 h-8">
                        <Image
                          src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.pseudo)}&backgroundColor=b6e3f4,c0aede,d1d4f9&radius=50`}
                          alt="Avatar utilisateur"
                          fill
                          className="rounded-full object-cover"
                        />
                      </div>
                      <span className="hidden md:block text-white text-sm font-medium">{user.pseudo}</span>
                      <svg className="hidden md:block w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
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
              </div>
            ) : (
              /* Guest buttons */
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="text-white hover:text-gray-300 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Se connecter
                </Link>
                <Link
                  href="/register"
                  className="bg-green-500 text-white hover:bg-green-600 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  S'inscrire
                </Link>
              </div>
            )}
        </div>
      </div>


      {/* Mobile navigation menu */}
      {user && (
        <div className="md:hidden bg-gray-800">
          <div role="navigation" aria-label="Menu mobile" className="px-2 pt-2 pb-3 space-y-2 sm:px-3 border-t border-gray-700">
            <Link
              href="/mes-sessions"
              className={`block px-4 py-3 text-base font-semibold text-white hover:text-gray-100 hover:bg-gray-700 rounded-md ${
                isActivePath('/mes-sessions') ? 'bg-gray-700' : ''
              }`}
            >
              Mes sessions
            </Link>
            <Link
              href="/mes-activites"
              className={`block px-4 py-3 text-base font-semibold text-white hover:text-gray-100 hover:bg-gray-700 rounded-md ${
                isActivePath('/mes-activites') ? 'bg-gray-700' : ''
              }`}
            >
              Mes activités
            </Link>
            <Link
              href="/mes-statistiques"
              className={`block px-4 py-3 text-base font-semibold text-white hover:text-gray-100 hover:bg-gray-700 rounded-md ${
                isActivePath('/mes-statistiques') ? 'bg-gray-700' : ''
              }`}
            >
              Mes statistiques
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}