import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import AdminUserList from '../../components/admin/AdminUserList'

// Mock fetch globally
global.fetch = jest.fn()

const mockUsers = [
  {
    id: 'user-1',
    email: 'player1@test.com',
    pseudo: 'Player1',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Player1',
    role: 'user',
    createdAt: new Date('2024-01-01T10:00:00.000Z'),
    _count: {
      matchPlayers: 5
    }
  },
  {
    id: 'user-2',
    email: 'player2@test.com',
    pseudo: 'Player2',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Player2',
    role: 'user',
    createdAt: new Date('2024-01-02T10:00:00.000Z'),
    _count: {
      matchPlayers: 3
    }
  },
  {
    id: 'admin-1',
    email: 'admin@futsal.local',
    pseudo: 'Admin',
    avatar: null,
    role: 'root',
    createdAt: new Date('2024-01-01T09:00:00.000Z'),
    _count: {
      matchPlayers: 0
    }
  }
]

const mockCurrentUser = {
  id: 'admin-1',
  pseudo: 'Admin',
  role: 'root' as const
}

describe('AdminUserList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { users: mockUsers }
      })
    })
  })

  describe('User List Display', () => {
    it('should render users list with basic information', async () => {
      render(<AdminUserList currentUser={mockCurrentUser} />)
      
      await waitFor(() => {
        expect(screen.getByText('Gestion des utilisateurs')).toBeInTheDocument()
        expect(screen.getByText('Player1')).toBeInTheDocument()
        expect(screen.getByText('Player2')).toBeInTheDocument()
        expect(screen.getByText('Admin')).toBeInTheDocument()
      })
    })

    it('should display user roles correctly', async () => {
      render(<AdminUserList currentUser={mockCurrentUser} />)
      
      await waitFor(() => {
        expect(screen.getAllByText('Utilisateur')).toHaveLength(2)
        expect(screen.getByText('Administrateur')).toBeInTheDocument()
      })
    })

    it('should show user statistics (match count)', async () => {
      render(<AdminUserList currentUser={mockCurrentUser} />)
      
      await waitFor(() => {
        expect(screen.getByText('5 matchs')).toBeInTheDocument()
        expect(screen.getByText('3 matchs')).toBeInTheDocument()
        expect(screen.getByText('0 matchs')).toBeInTheDocument()
      })
    })

    it('should display creation dates', async () => {
      render(<AdminUserList currentUser={mockCurrentUser} />)
      
      await waitFor(() => {
        expect(screen.getByText('1 janvier 2024')).toBeInTheDocument()
        expect(screen.getByText('2 janvier 2024')).toBeInTheDocument()
      })
    })
  })

  describe('Search and Filtering', () => {
    it('should have search input', async () => {
      render(<AdminUserList currentUser={mockCurrentUser} />)
      
      const searchInput = screen.getByPlaceholderText('Rechercher un utilisateur...')
      expect(searchInput).toBeInTheDocument()
    })

    it('should filter users by pseudo when searching', async () => {
      render(<AdminUserList currentUser={mockCurrentUser} />)
      
      await waitFor(() => {
        expect(screen.getByText('Player1')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Rechercher un utilisateur...')
      fireEvent.change(searchInput, { target: { value: 'Player1' } })

      await waitFor(() => {
        expect(screen.getByText('Player1')).toBeInTheDocument()
        expect(screen.queryByText('Player2')).not.toBeInTheDocument()
      })
    })

    it('should filter users by email when searching', async () => {
      render(<AdminUserList currentUser={mockCurrentUser} />)
      
      const searchInput = screen.getByPlaceholderText('Rechercher un utilisateur...')
      fireEvent.change(searchInput, { target: { value: 'admin@futsal.local' } })

      await waitFor(() => {
        expect(screen.getByText('Admin')).toBeInTheDocument()
        expect(screen.queryByText('Player1')).not.toBeInTheDocument()
      })
    })

    it('should have role filter dropdown', async () => {
      render(<AdminUserList currentUser={mockCurrentUser} />)
      
      const roleFilter = screen.getByLabelText('Filtrer par rôle')
      expect(roleFilter).toBeInTheDocument()
      
      // Check options
      expect(screen.getByText('Tous')).toBeInTheDocument()
      expect(screen.getByText('Utilisateurs')).toBeInTheDocument()
      expect(screen.getByText('Administrateurs')).toBeInTheDocument()
    })

    it('should filter by role', async () => {
      render(<AdminUserList currentUser={mockCurrentUser} />)
      
      await waitFor(() => {
        expect(screen.getByText('Player1')).toBeInTheDocument()
      })

      const roleFilter = screen.getByLabelText('Filtrer par rôle')
      fireEvent.change(roleFilter, { target: { value: 'root' } })

      await waitFor(() => {
        expect(screen.getByText('Admin')).toBeInTheDocument()
        expect(screen.queryByText('Player1')).not.toBeInTheDocument()
      })
    })
  })

  describe('User Actions', () => {
    it('should show action buttons for each user', async () => {
      render(<AdminUserList currentUser={mockCurrentUser} />)
      
      await waitFor(() => {
        const resetButtons = screen.getAllByText('Réinitialiser mot de passe')
        const deleteButtons = screen.getAllByText('Supprimer')
        
        expect(resetButtons).toHaveLength(2) // Not for current admin
        expect(deleteButtons).toHaveLength(2) // Not for current admin
      })
    })

    it('should not show actions for current admin', async () => {
      render(<AdminUserList currentUser={mockCurrentUser} />)
      
      await waitFor(() => {
        // Admin row should exist but without action buttons
        expect(screen.getByText('Admin')).toBeInTheDocument()
        
        // Count total action buttons - should be for other users only
        const allResetButtons = screen.getAllByText('Réinitialiser mot de passe')
        expect(allResetButtons).toHaveLength(2)
      })
    })

    it('should handle password reset', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: { users: mockUsers } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 
            success: true, 
            message: 'Mot de passe réinitialisé',
            data: { temporaryPassword: 'temp123' }
          })
        })

      const onSuccess = jest.fn()
      render(<AdminUserList currentUser={mockCurrentUser} onSuccess={onSuccess} />)
      
      await waitFor(() => {
        expect(screen.getByText('Player1')).toBeInTheDocument()
      })

      const resetButtons = screen.getAllByText('Réinitialiser mot de passe')
      fireEvent.click(resetButtons[0])

      // Confirmation modal should appear
      await waitFor(() => {
        expect(screen.getByText('Générer un nouveau mot de passe')).toBeInTheDocument()
      })

      const confirmButton = screen.getByText('Réinitialiser')
      fireEvent.click(confirmButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/users/user-1/reset-password',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ generateTemporary: true })
          })
        )
        expect(onSuccess).toHaveBeenCalledWith('Mot de passe réinitialisé. Mot de passe temporaire: temp123')
      })
    })

    it('should handle user deletion', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: { users: mockUsers } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, message: 'Utilisateur supprimé' })
        })

      const onSuccess = jest.fn()
      render(<AdminUserList currentUser={mockCurrentUser} onSuccess={onSuccess} />)
      
      await waitFor(() => {
        expect(screen.getByText('Player1')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByText('Supprimer')
      fireEvent.click(deleteButtons[0])

      // Confirmation modal should appear
      await waitFor(() => {
        expect(screen.getByText('Supprimer l\'utilisateur Player1')).toBeInTheDocument()
      })

      const confirmButton = screen.getByText('Supprimer définitivement')
      fireEvent.click(confirmButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/users/user-1',
          expect.objectContaining({
            method: 'DELETE'
          })
        )
        expect(onSuccess).toHaveBeenCalledWith('Utilisateur supprimé')
      })
    })
  })

  describe('Loading and Error States', () => {
    it('should show loading state initially', () => {
      ;(global.fetch as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      )

      render(<AdminUserList currentUser={mockCurrentUser} />)
      
      expect(screen.getByText('Chargement des utilisateurs...')).toBeInTheDocument()
    })

    it('should handle API errors', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      const onError = jest.fn()
      render(<AdminUserList currentUser={mockCurrentUser} onError={onError} />)
      
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Erreur lors du chargement des utilisateurs')
      })
    })

    it('should show empty state when no users', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { users: [] }
        })
      })

      render(<AdminUserList currentUser={mockCurrentUser} />)
      
      await waitFor(() => {
        expect(screen.getByText('Aucun utilisateur trouvé')).toBeInTheDocument()
      })
    })

    it('should show loading indicator during actions', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: { users: mockUsers } })
        })
        .mockImplementation(() => new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({ success: true })
          }), 100)
        ))

      render(<AdminUserList currentUser={mockCurrentUser} />)
      
      await waitFor(() => {
        expect(screen.getByText('Player1')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByText('Supprimer')
      fireEvent.click(deleteButtons[0])

      await waitFor(() => {
        const confirmButton = screen.getByText('Supprimer définitivement')
        fireEvent.click(confirmButton)
      })

      expect(screen.getByTestId('action-loading')).toBeInTheDocument()
    })
  })

  describe('Permissions and Security', () => {
    it('should prevent non-admin from accessing', () => {
      const regularUser = { ...mockCurrentUser, role: 'user' as const }
      
      render(<AdminUserList currentUser={regularUser} />)
      
      expect(screen.getByText('Accès non autorisé')).toBeInTheDocument()
      expect(screen.queryByText('Gestion des utilisateurs')).not.toBeInTheDocument()
    })

    it('should not allow deleting last admin', async () => {
      const singleAdminUsers = [
        {
          id: 'admin-1',
          email: 'admin@futsal.local',
          pseudo: 'Admin',
          avatar: null,
          role: 'root',
          createdAt: new Date('2024-01-01T09:00:00.000Z'),
          _count: { matchPlayers: 0 }
        }
      ]

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { users: singleAdminUsers }
        })
      })

      render(<AdminUserList currentUser={mockCurrentUser} />)
      
      await waitFor(() => {
        expect(screen.getByText('Admin')).toBeInTheDocument()
        expect(screen.queryByText('Supprimer')).not.toBeInTheDocument()
      })
    })
  })

  describe('Sorting', () => {
    it('should have sortable columns', async () => {
      render(<AdminUserList currentUser={mockCurrentUser} />)
      
      await waitFor(() => {
        expect(screen.getByText('Nom')).toBeInTheDocument()
      })

      const nameHeader = screen.getByText('Nom')
      expect(nameHeader.closest('th')).toHaveClass('cursor-pointer')
    })

    it('should sort by name when header clicked', async () => {
      render(<AdminUserList currentUser={mockCurrentUser} />)
      
      await waitFor(() => {
        expect(screen.getByText('Nom')).toBeInTheDocument()
      })

      const nameHeader = screen.getByText('Nom')
      fireEvent.click(nameHeader)

      // Should show sorting indicator
      expect(screen.getByTestId('sort-indicator')).toBeInTheDocument()
    })
  })
})