'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { User } from '@/types'

interface SidebarProps {
  user: User | null
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ user, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [hasCreatedActivities, setHasCreatedActivities] = useState(false)
  const [loadingActivities, setLoadingActivities] = useState(true)

  // Close sidebar when route changes
  useEffect(() => {
    onClose()
  }, [pathname, onClose])

  // Check if user has created activities
  useEffect(() => {
    const checkCreatedActivities = async () => {
      if (!user?.id) {
        setLoadingActivities(false)
        return
      }

      try {
        const response = await fetch('/api/activities/my-created')
        const data = await response.json()

        if (data.success) {
          setHasCreatedActivities(data.data.totalCount > 0)
        }
      } catch (error) {
        console.error('Erreur lors de la vérification des activités créées:', error)
      } finally {
        setLoadingActivities(false)
      }
    }

    checkCreatedActivities()
  }, [user?.id])

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!user) {
    return null
  }

  const navigationItems = [
    {
      name: 'Mes Activités',
      href: '/mes-activites',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      name: 'Gestion',
      href: '/my-activities/manage',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      requiresCreatedActivities: true
    },
    {
      name: 'Mes Statistiques',
      href: '/mes-statistiques',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      name: 'Mon Profil',
      href: '/profile',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
  ]

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href)
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
          role="button"
          aria-label="Fermer le menu"
        />
      )}

      {/* Sidebar */}
      <nav
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:z-auto md:shadow-none md:border-r md:border-gray-200`}
        aria-label="Menu principal"
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center px-4 py-4 border-b border-gray-200">
            <div className="relative w-10 h-10">
              <Image
                src="/images/stepzy_logo.jpg"
                alt="Stepzy Logo"
                fill
                className="rounded-lg object-cover"
              />
            </div>
            <span className="ml-3 text-lg font-semibold text-gray-900">
              Stepzy
            </span>
          </div>

          {/* Navigation */}
          <div className="flex-1 px-4 py-6 overflow-y-auto">
            {/* Main Navigation */}
            <div className="mb-8">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Navigation principale
              </h3>
              <div className="space-y-1">
                {navigationItems
                  .filter(item => {
                    // Filtrer l'onglet "Gestion" s'il n'y a pas d'activités créées
                    if (item.requiresCreatedActivities && !hasCreatedActivities) {
                      return false
                    }
                    return true
                  })
                  .map((item) => {
                    const active = isActive(item.href)
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          active
                            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                            : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                        }`}
                      >
                        <span className={`mr-3 ${active ? 'text-blue-700' : 'text-gray-400'}`}>
                          {item.icon}
                        </span>
                        {item.name}
                      </Link>
                    )
                  })}
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="relative w-10 h-10 mr-3">
                <Image
                  src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.pseudo)}&backgroundColor=b6e3f4,c0aede,d1d4f9&radius=50`}
                  alt="Avatar utilisateur"
                  fill
                  className="rounded-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.pseudo}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}