'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'

interface User {
  id: string
  email: string
  pseudo: string
  avatar: string | null
  role: 'user' | 'root'
  createdAt: Date
  _count: {
    matchPlayers: number
  }
}

interface AdminUserListProps {
  currentUser: {
    id: string
    pseudo: string
    role: 'user' | 'root'
  }
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
}

const AdminUserList: React.FC<AdminUserListProps> = ({ 
  currentUser, 
  onSuccess, 
  onError 
}) => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [sortField, setSortField] = useState<'pseudo' | 'email' | 'createdAt' | 'matchCount'>('pseudo')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [actionType, setActionType] = useState<'reset' | 'delete' | null>(null)

  // Check if user is admin
  if (currentUser.role !== 'root') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Accès non autorisé</h2>
          <p className="text-gray-600">Vous devez être administrateur pour accéder à cette page.</p>
        </div>
      </div>
    )
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/users')
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUsers(data.data.users.map((user: any) => ({
            ...user,
            createdAt: new Date(user.createdAt)
          })))
        } else {
          onError?.('Erreur lors du chargement des utilisateurs')
        }
      } else {
        onError?.('Erreur lors du chargement des utilisateurs')
      }
    } catch (error) {
      onError?.('Erreur lors du chargement des utilisateurs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter(user => {
      const matchesSearch = 
        user.pseudo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesRole = roleFilter === 'all' || user.role === roleFilter

      return matchesSearch && matchesRole
    })

    // Sort users
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'pseudo':
          aValue = a.pseudo.toLowerCase()
          bValue = b.pseudo.toLowerCase()
          break
        case 'email':
          aValue = a.email.toLowerCase()
          bValue = b.email.toLowerCase()
          break
        case 'createdAt':
          aValue = a.createdAt.getTime()
          bValue = b.createdAt.getTime()
          break
        case 'matchCount':
          aValue = a._count.matchPlayers
          bValue = b._count.matchPlayers
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [users, searchTerm, roleFilter, sortField, sortDirection])

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date)
  }

  const handleResetPassword = async (user: User) => {
    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${user.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ generateTemporary: true })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const tempPassword = data.data?.temporaryPassword
          const message = tempPassword 
            ? `Mot de passe réinitialisé. Mot de passe temporaire: ${tempPassword}`
            : data.message
          onSuccess?.(message)
          fetchUsers() // Refresh list
        } else {
          onError?.(data.error || 'Erreur lors de la réinitialisation')
        }
      } else {
        onError?.('Erreur lors de la réinitialisation du mot de passe')
      }
    } catch (error) {
      onError?.('Erreur lors de la réinitialisation du mot de passe')
    } finally {
      setActionLoading(false)
      setSelectedUser(null)
      setActionType(null)
    }
  }

  const handleDeleteUser = async (user: User) => {
    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          onSuccess?.(data.message || 'Utilisateur supprimé')
          fetchUsers() // Refresh list
        } else {
          onError?.(data.error || 'Erreur lors de la suppression')
        }
      } else {
        onError?.('Erreur lors de la suppression de l\'utilisateur')
      }
    } catch (error) {
      onError?.('Erreur lors de la suppression de l\'utilisateur')
    } finally {
      setActionLoading(false)
      setSelectedUser(null)
      setActionType(null)
    }
  }

  const canDeleteUser = (user: User) => {
    // Cannot delete self or if it's the last admin
    if (user.id === currentUser.id) return false
    if (user.role === 'root') {
      const adminCount = users.filter(u => u.role === 'root').length
      return adminCount > 1
    }
    return true
  }

  const SortIndicator = ({ field }: { field: string }) => {
    if (sortField !== field) return <span className="text-gray-400">⇅</span>
    return (
      <span data-testid="sort-indicator" className="text-blue-600">
        {sortDirection === 'asc' ? '↑' : '↓'}
      </span>
    )
  }

  const ConfirmationModal = () => {
    if (!selectedUser || !actionType) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold mb-4">
            {actionType === 'reset' 
              ? 'Réinitialiser le mot de passe'
              : `Supprimer l'utilisateur ${selectedUser.pseudo}`
            }
          </h3>
          
          <p className="text-gray-600 mb-6">
            {actionType === 'reset'
              ? 'Générer un nouveau mot de passe temporaire pour cet utilisateur ?'
              : 'Cette action est irréversible. L\'utilisateur et toutes ses données seront supprimés.'
            }
          </p>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setSelectedUser(null)
                setActionType(null)
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              disabled={actionLoading}
            >
              Annuler
            </button>
            <button
              onClick={() => {
                if (actionType === 'reset') {
                  handleResetPassword(selectedUser)
                } else {
                  handleDeleteUser(selectedUser)
                }
              }}
              disabled={actionLoading}
              className={`px-4 py-2 text-white rounded hover:opacity-90 ${
                actionType === 'reset' 
                  ? 'bg-blue-600' 
                  : 'bg-red-600'
              }`}
            >
              {actionLoading ? (
                <div data-testid="action-loading" className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                actionType === 'reset' ? 'Réinitialiser' : 'Supprimer définitivement'
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des utilisateurs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Gestion des utilisateurs</h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Filtrer par rôle"
            >
              <option value="all">Tous</option>
              <option value="user">Utilisateurs</option>
              <option value="root">Administrateurs</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {filteredAndSortedUsers.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Avatar</th>
                  <th 
                    className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('pseudo')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Nom</span>
                      <SortIndicator field="pseudo" />
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('email')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Email</span>
                      <SortIndicator field="email" />
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Rôle</th>
                  <th 
                    className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('matchCount')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Matchs</span>
                      <SortIndicator field="matchCount" />
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Inscription</span>
                      <SortIndicator field="createdAt" />
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAndSortedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="w-8 h-8 rounded-full overflow-hidden">
                        {user.avatar ? (
                          <Image
                            src={user.avatar}
                            alt={`${user.pseudo} avatar`}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600 text-sm">
                            {user.pseudo.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">{user.pseudo}</td>
                    <td className="py-3 px-4 text-gray-600">{user.email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'root' 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {user.role === 'root' ? 'Administrateur' : 'Utilisateur'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {user._count.matchPlayers} matchs
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      {user.id !== currentUser.id && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user)
                              setActionType('reset')
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Réinitialiser mot de passe
                          </button>
                          {canDeleteUser(user) && (
                            <button
                              onClick={() => {
                                setSelectedUser(user)
                                setActionType('delete')
                              }}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Supprimer
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmationModal />
    </div>
  )
}

export default AdminUserList