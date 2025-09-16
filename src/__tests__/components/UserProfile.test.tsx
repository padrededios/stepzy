import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import UserProfile from '../../components/profile/UserProfile'

// Mock fetch globally
global.fetch = jest.fn()

const mockUser = {
  id: 'user-1',
  email: 'player1@test.com',
  pseudo: 'Player1',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Player1',
  role: 'user' as const,
  createdAt: new Date('2024-01-01T10:00:00.000Z'),
  updatedAt: new Date('2024-01-15T10:00:00.000Z')
}

const mockUserStats = {
  totalMatches: 15,
  completedMatches: 12,
  cancelledMatches: 2,
  attendanceRate: 80,
  favoriteTime: '12:30',
  currentStreak: 3,
  longestStreak: 7
}

describe('UserProfile Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock fetch for stats and preferences
    ;(global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/stats')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: { stats: mockUserStats }
          })
        })
      }
      
      if (url.includes('/preferences')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: { 
              preferences: {
                emailNotifications: true,
                newMatches: true,
                matchReminders: false,
                cancellations: true
              }
            }
          })
        })
      }
      
      // Default mock
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, data: {} })
      })
    })
  })

  describe('Profile Display', () => {
    it('should render user profile information', async () => {
      render(<UserProfile user={mockUser} />)
      
      await waitFor(() => {
        expect(screen.getByText('Mon Profil')).toBeInTheDocument()
        expect(screen.getByText('Player1')).toBeInTheDocument()
        expect(screen.getByText('player1@test.com')).toBeInTheDocument()
        expect(screen.getByText('Utilisateur')).toBeInTheDocument()
      })
    })

    it('should display user avatar', async () => {
      render(<UserProfile user={mockUser} />)
      
      await waitFor(() => {
        const avatar = screen.getByAltText('Avatar de Player1')
        expect(avatar).toBeInTheDocument()
        expect(avatar).toHaveAttribute('src', mockUser.avatar)
      })
    })

    it('should show registration date', async () => {
      render(<UserProfile user={mockUser} />)
      
      await waitFor(() => {
        expect(screen.getByText(/Membre depuis/)).toBeInTheDocument()
        expect(screen.getByText(/janvier 2024/)).toBeInTheDocument()
      })
    })

    it('should display admin badge for admin users', async () => {
      const adminUser = { ...mockUser, role: 'root' as const }
      render(<UserProfile user={adminUser} />)
      
      await waitFor(() => {
        expect(screen.getByText('Administrateur')).toBeInTheDocument()
      })
    })
  })

  describe('Personal Statistics', () => {
    it('should display user statistics cards', async () => {
      render(<UserProfile user={mockUser} />)
      
      await waitFor(() => {
        expect(screen.getByText('15')).toBeInTheDocument() // Total matches
        expect(screen.getByText('12')).toBeInTheDocument() // Completed matches
        expect(screen.getByText('80%')).toBeInTheDocument() // Attendance rate
        expect(screen.getByText('3')).toBeInTheDocument() // Current streak
      })
    })

    it('should show favorite time slot', async () => {
      render(<UserProfile user={mockUser} />)
      
      await waitFor(() => {
        expect(screen.getByText('Créneau préféré')).toBeInTheDocument()
        expect(screen.getByText('12:30')).toBeInTheDocument()
      })
    })

    it('should display longest streak', async () => {
      render(<UserProfile user={mockUser} />)
      
      await waitFor(() => {
        expect(screen.getByText('Record de participation')).toBeInTheDocument()
        expect(screen.getByText('7 matchs consécutifs')).toBeInTheDocument()
      })
    })

    it('should handle loading state for statistics', () => {
      ;(global.fetch as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      )
      
      render(<UserProfile user={mockUser} />)
      
      expect(screen.getByTestId('stats-loading')).toBeInTheDocument()
      expect(screen.getByText('Chargement des statistiques...')).toBeInTheDocument()
    })

    it('should handle statistics fetch error', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))
      
      const onError = jest.fn()
      render(<UserProfile user={mockUser} onError={onError} />)
      
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Erreur lors du chargement des statistiques')
      })
    })
  })

  describe('Profile Editing', () => {
    it('should have edit profile button', async () => {
      render(<UserProfile user={mockUser} />)
      
      await waitFor(() => {
        expect(screen.getByText('Modifier le profil')).toBeInTheDocument()
      })
    })

    it('should show edit form when edit button clicked', async () => {
      render(<UserProfile user={mockUser} />)
      
      await waitFor(() => {
        const editButton = screen.getByText('Modifier le profil')
        fireEvent.click(editButton)
      })
      
      await waitFor(() => {
        expect(screen.getByLabelText('Pseudo')).toBeInTheDocument()
        expect(screen.getByLabelText('Email')).toBeInTheDocument()
        expect(screen.getByText('Enregistrer')).toBeInTheDocument()
        expect(screen.getByText('Annuler')).toBeInTheDocument()
      })
    })

    it('should pre-fill edit form with current values', async () => {
      render(<UserProfile user={mockUser} />)
      
      await waitFor(() => {
        const editButton = screen.getByText('Modifier le profil')
        fireEvent.click(editButton)
      })
      
      await waitFor(() => {
        const pseudoInput = screen.getByLabelText('Pseudo') as HTMLInputElement
        const emailInput = screen.getByLabelText('Email') as HTMLInputElement
        
        expect(pseudoInput.value).toBe('Player1')
        expect(emailInput.value).toBe('player1@test.com')
      })
    })

    it('should cancel editing when cancel button clicked', async () => {
      render(<UserProfile user={mockUser} />)
      
      await waitFor(() => {
        const editButton = screen.getByText('Modifier le profil')
        fireEvent.click(editButton)
      })
      
      const cancelButton = screen.getByText('Annuler')
      fireEvent.click(cancelButton)
      
      await waitFor(() => {
        expect(screen.queryByLabelText('Pseudo')).not.toBeInTheDocument()
        expect(screen.getByText('Modifier le profil')).toBeInTheDocument()
      })
    })

    it('should validate required fields', async () => {
      render(<UserProfile user={mockUser} />)
      
      const editButton = screen.getByText('Modifier le profil')
      fireEvent.click(editButton)
      
      const pseudoInput = screen.getByLabelText('Pseudo')
      fireEvent.change(pseudoInput, { target: { value: '' } })
      
      const saveButton = screen.getByText('Enregistrer')
      fireEvent.click(saveButton)
      
      await waitFor(() => {
        expect(screen.getByText('Le pseudo est obligatoire')).toBeInTheDocument()
      })
    })

    it('should save profile changes successfully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { user: { ...mockUser, pseudo: 'NewPseudo' } }
        })
      })
      
      const onSuccess = jest.fn()
      render(<UserProfile user={mockUser} onSuccess={onSuccess} />)
      
      const editButton = screen.getByText('Modifier le profil')
      fireEvent.click(editButton)
      
      const pseudoInput = screen.getByLabelText('Pseudo')
      fireEvent.change(pseudoInput, { target: { value: 'NewPseudo' } })
      
      const saveButton = screen.getByText('Enregistrer')
      fireEvent.click(saveButton)
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/user/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pseudo: 'NewPseudo',
            email: 'player1@test.com'
          })
        })
        expect(onSuccess).toHaveBeenCalledWith('Profil mis à jour avec succès')
      })
    })

    it('should handle profile update errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({
          success: false,
          error: 'Ce pseudo est déjà utilisé'
        })
      })
      
      const onError = jest.fn()
      render(<UserProfile user={mockUser} onError={onError} />)
      
      const editButton = screen.getByText('Modifier le profil')
      fireEvent.click(editButton)
      
      const saveButton = screen.getByText('Enregistrer')
      fireEvent.click(saveButton)
      
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Ce pseudo est déjà utilisé')
      })
    })
  })

  describe('Avatar Upload', () => {
    it('should have avatar upload button', async () => {
      render(<UserProfile user={mockUser} />)
      
      await waitFor(() => {
        expect(screen.getByText('Changer l\'avatar')).toBeInTheDocument()
      })
    })

    it('should show file input when avatar upload clicked', async () => {
      render(<UserProfile user={mockUser} />)
      
      const uploadButton = screen.getByText('Changer l\'avatar')
      fireEvent.click(uploadButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('avatar-file-input')).toBeInTheDocument()
      })
    })

    it('should validate file type for avatar upload', async () => {
      render(<UserProfile user={mockUser} />)
      
      const uploadButton = screen.getByText('Changer l\'avatar')
      fireEvent.click(uploadButton)
      
      const fileInput = screen.getByTestId('avatar-file-input')
      const invalidFile = new File(['content'], 'test.txt', { type: 'text/plain' })
      
      fireEvent.change(fileInput, { target: { files: [invalidFile] } })
      
      await waitFor(() => {
        expect(screen.getByText('Seuls les fichiers image sont autorisés')).toBeInTheDocument()
      })
    })

    it('should validate file size for avatar upload', async () => {
      render(<UserProfile user={mockUser} />)
      
      const uploadButton = screen.getByText('Changer l\'avatar')
      fireEvent.click(uploadButton)
      
      const fileInput = screen.getByTestId('avatar-file-input')
      // Create a large file (> 2MB)
      const largeFile = new File(['x'.repeat(3 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' })
      
      Object.defineProperty(largeFile, 'size', { value: 3 * 1024 * 1024 })
      
      fireEvent.change(fileInput, { target: { files: [largeFile] } })
      
      await waitFor(() => {
        expect(screen.getByText('La taille du fichier ne doit pas dépasser 2MB')).toBeInTheDocument()
      })
    })

    it('should upload avatar successfully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { avatarUrl: 'https://example.com/new-avatar.jpg' }
        })
      })
      
      const onSuccess = jest.fn()
      render(<UserProfile user={mockUser} onSuccess={onSuccess} />)
      
      const uploadButton = screen.getByText('Changer l\'avatar')
      fireEvent.click(uploadButton)
      
      const fileInput = screen.getByTestId('avatar-file-input')
      const validFile = new File(['image-content'], 'avatar.jpg', { type: 'image/jpeg' })
      
      fireEvent.change(fileInput, { target: { files: [validFile] } })
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/user/avatar', expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData)
        }))
        expect(onSuccess).toHaveBeenCalledWith('Avatar mis à jour avec succès')
      })
    })
  })

  describe('Notification Preferences', () => {
    it('should display notification settings section', async () => {
      render(<UserProfile user={mockUser} />)
      
      await waitFor(() => {
        expect(screen.getByText('Préférences de notifications')).toBeInTheDocument()
        expect(screen.getByLabelText('Notifications par email')).toBeInTheDocument()
        expect(screen.getByLabelText('Nouveaux matchs')).toBeInTheDocument()
        expect(screen.getByLabelText('Rappels de match')).toBeInTheDocument()
        expect(screen.getByLabelText('Annulations')).toBeInTheDocument()
      })
    })

    it('should load current notification preferences', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { 
            preferences: {
              emailNotifications: true,
              newMatches: true,
              matchReminders: false,
              cancellations: true
            }
          }
        })
      })
      
      render(<UserProfile user={mockUser} />)
      
      await waitFor(() => {
        const emailToggle = screen.getByLabelText('Notifications par email') as HTMLInputElement
        const newMatchesToggle = screen.getByLabelText('Nouveaux matchs') as HTMLInputElement
        const remindersToggle = screen.getByLabelText('Rappels de match') as HTMLInputElement
        
        expect(emailToggle.checked).toBe(true)
        expect(newMatchesToggle.checked).toBe(true)
        expect(remindersToggle.checked).toBe(false)
      })
    })

    it('should save notification preferences', async () => {
      render(<UserProfile user={mockUser} />)
      
      await waitFor(() => {
        const emailToggle = screen.getByLabelText('Notifications par email')
        fireEvent.click(emailToggle)
      })
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/user/preferences', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('emailNotifications')
        })
      })
    })
  })

  describe('Responsive Design', () => {
    it('should adapt to mobile layout', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })
      
      render(<UserProfile user={mockUser} />)
      
      expect(screen.getByTestId('profile-mobile-layout')).toBeInTheDocument()
    })

    it('should show desktop layout on large screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024
      })
      
      render(<UserProfile user={mockUser} />)
      
      expect(screen.getByTestId('profile-desktop-layout')).toBeInTheDocument()
    })
  })
})