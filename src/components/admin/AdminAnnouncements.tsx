'use client'

import { useState, useEffect } from 'react'

interface Announcement {
  id: string
  title: string
  content: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  active: boolean
  createdAt: Date
  updatedAt: Date
  author: {
    id: string
    pseudo: string
    avatar: string
  }
}

interface AdminAnnouncementsProps {
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
}

export default function AdminAnnouncements({ onSuccess, onError }: AdminAnnouncementsProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'normal' as const,
    sendNotifications: false
  })

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/announcements')
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const parsedAnnouncements = data.data.announcements.map((ann: any) => ({
            ...ann,
            createdAt: new Date(ann.createdAt),
            updatedAt: new Date(ann.updatedAt)
          }))
          setAnnouncements(parsedAnnouncements)
        } else {
          onError?.('Erreur lors du chargement des annonces')
        }
      }
    } catch (error) {
      onError?.('Erreur lors du chargement des annonces')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingId 
        ? `/api/admin/announcements/${editingId}`
        : '/api/admin/announcements'
      
      const method = editingId ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          onSuccess?.(editingId ? 'Annonce mise à jour avec succès' : 'Annonce créée avec succès')
          resetForm()
          fetchAnnouncements()
        } else {
          onError?.(data.error || 'Erreur lors de l\'opération')
        }
      } else {
        const data = await response.json()
        onError?.(data.error || 'Erreur lors de l\'opération')
      }
    } catch (error) {
      onError?.('Erreur lors de l\'opération')
    }
  }

  const handleEdit = (announcement: Announcement) => {
    setFormData({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      sendNotifications: false
    })
    setEditingId(announcement.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/announcements/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        onSuccess?.('Annonce supprimée avec succès')
        fetchAnnouncements()
      } else {
        const data = await response.json()
        onError?.(data.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      onError?.('Erreur lors de la suppression')
    }
  }

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/announcements/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive })
      })

      if (response.ok) {
        onSuccess?.(currentActive ? 'Annonce désactivée' : 'Annonce activée')
        fetchAnnouncements()
      } else {
        const data = await response.json()
        onError?.(data.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      onError?.('Erreur lors de la mise à jour')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      priority: 'normal',
      sendNotifications: false
    })
    setEditingId(null)
    setShowForm(false)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700'
      case 'high':
        return 'bg-orange-100 text-orange-700'
      case 'normal':
        return 'bg-blue-100 text-blue-700'
      case 'low':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'Urgent'
      case 'high':
        return 'Élevée'
      case 'normal':
        return 'Normale'
      case 'low':
        return 'Faible'
      default:
        return priority
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Annonces</h2>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
        >
          Nouvelle annonce
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  {editingId ? 'Modifier l\'annonce' : 'Nouvelle annonce'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titre *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                    maxLength={200}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contenu *
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    required
                    maxLength={5000}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.content.length}/5000 caractères
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priorité
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="low">Faible</option>
                    <option value="normal">Normale</option>
                    <option value="high">Élevée</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                {!editingId && (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="sendNotifications"
                      checked={formData.sendNotifications}
                      onChange={(e) => setFormData({ ...formData, sendNotifications: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="sendNotifications" className="ml-2 text-sm text-gray-700">
                      Envoyer une notification à tous les utilisateurs
                    </label>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingId ? 'Mettre à jour' : 'Créer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Announcements List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des annonces...</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📢</div>
          <p className="text-gray-600">Aucune annonce créée</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div key={announcement.id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {announcement.title}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(announcement.priority)}`}>
                      {getPriorityLabel(announcement.priority)}
                    </span>
                    {!announcement.active && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-200 text-gray-600">
                        Désactivée
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 whitespace-pre-wrap">{announcement.content}</p>
                  <p className="text-sm text-gray-500 mt-3">
                    Par {announcement.author.pseudo} • {announcement.createdAt.toLocaleString('fr-FR')}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => toggleActive(announcement.id, announcement.active)}
                    className={`p-2 rounded-md ${
                      announcement.active
                        ? 'text-green-600 hover:bg-green-100'
                        : 'text-gray-400 hover:bg-gray-100'
                    }`}
                    title={announcement.active ? 'Désactiver' : 'Activer'}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleEdit(announcement)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-md"
                    title="Modifier"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(announcement.id)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-md"
                    title="Supprimer"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}