import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import MatchCreationForm from '../../components/admin/MatchCreationForm'

// Mock fetch globally
global.fetch = jest.fn()

const mockCurrentUser = {
  id: 'admin-1',
  pseudo: 'Admin',
  role: 'root' as const
}

describe('MatchCreationForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          match: {
            id: 'match-1',
            date: new Date('2024-01-15T12:30:00.000Z'),
            maxPlayers: 12,
            status: 'open'
          }
        }
      })
    })
  })

  describe('Form Rendering', () => {
    it('should render match creation form with all fields', () => {
      render(<MatchCreationForm currentUser={mockCurrentUser} />)
      
      expect(screen.getByLabelText('Date du match')).toBeInTheDocument()
      expect(screen.getByLabelText('Heure de début')).toBeInTheDocument()
      expect(screen.getByLabelText('Nombre maximum de joueurs')).toBeInTheDocument()
      expect(screen.getByLabelText('Description (optionnel)')).toBeInTheDocument()
      expect(screen.getByText('Créer le match')).toBeInTheDocument()
    })

    it('should have correct default values', () => {
      render(<MatchCreationForm currentUser={mockCurrentUser} />)
      
      const maxPlayersInput = screen.getByLabelText('Nombre maximum de joueurs') as HTMLInputElement
      expect(maxPlayersInput.value).toBe('12')
      
      const timeInput = screen.getByLabelText('Heure de début') as HTMLSelectElement
      expect(timeInput.value).toBe('12:00')
    })

    it('should show recurring match options', () => {
      render(<MatchCreationForm currentUser={mockCurrentUser} />)
      
      expect(screen.getByLabelText('Match récurrent')).toBeInTheDocument()
      
      // Check recurring options initially hidden
      expect(screen.queryByLabelText('Répéter chaque')).not.toBeInTheDocument()
    })

    it('should show recurring options when enabled', async () => {
      render(<MatchCreationForm currentUser={mockCurrentUser} />)
      
      const recurringCheckbox = screen.getByLabelText('Match récurrent')
      fireEvent.click(recurringCheckbox)
      
      await waitFor(() => {
        expect(screen.getByLabelText('Répéter chaque')).toBeInTheDocument()
        expect(screen.getByLabelText('Fin des récurrences')).toBeInTheDocument()
        expect(screen.getByLabelText('Nombre de matchs à créer')).toBeInTheDocument()
      })
    })
  })

  describe('Time Constraints Validation', () => {
    it('should only allow times between 12:00 and 14:00', () => {
      render(<MatchCreationForm currentUser={mockCurrentUser} />)
      
      const timeSelect = screen.getByLabelText('Heure de début') as HTMLSelectElement
      const options = Array.from(timeSelect.options).map(option => option.value)
      
      expect(options).toContain('12:00')
      expect(options).toContain('12:30')
      expect(options).toContain('13:00')
      expect(options).toContain('13:30')
      expect(options).not.toContain('11:30')
      expect(options).not.toContain('14:30')
    })

    it('should validate weekday only (Monday to Friday)', async () => {
      render(<MatchCreationForm currentUser={mockCurrentUser} />)
      
      // Try to set a Saturday (weekend day)
      const dateInput = screen.getByLabelText('Date du match')
      fireEvent.change(dateInput, { target: { value: '2024-01-13' } }) // Saturday
      
      const submitButton = screen.getByText('Créer le match')
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Les matchs ne peuvent avoir lieu que du lundi au vendredi')).toBeInTheDocument()
      })
    })

    it('should validate minimum 24h advance booking', async () => {
      render(<MatchCreationForm currentUser={mockCurrentUser} />)
      
      // Mock current date to control validation
      const mockDate = new Date('2024-01-14T15:00:00.000Z')
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any)
      
      const dateInput = screen.getByLabelText('Date du match')
      fireEvent.change(dateInput, { target: { value: '2024-01-14' } }) // Same day
      
      const submitButton = screen.getByText('Créer le match')
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Le match doit être créé au moins 24h à l\'avance')).toBeInTheDocument()
      })
    })

    it('should validate maximum 2 weeks advance booking', async () => {
      render(<MatchCreationForm currentUser={mockCurrentUser} />)
      
      const mockDate = new Date('2024-01-01T12:00:00.000Z')
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any)
      
      const dateInput = screen.getByLabelText('Date du match')
      fireEvent.change(dateInput, { target: { value: '2024-01-20' } }) // More than 2 weeks
      
      const submitButton = screen.getByText('Créer le match')
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Le match ne peut pas être créé plus de 2 semaines à l\'avance')).toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('should create single match successfully', async () => {
      const onSuccess = jest.fn()
      render(<MatchCreationForm currentUser={mockCurrentUser} onSuccess={onSuccess} />)
      
      // Fill form with valid data
      const dateInput = screen.getByLabelText('Date du match')
      fireEvent.change(dateInput, { target: { value: '2024-01-15' } })
      
      const timeSelect = screen.getByLabelText('Heure de début')
      fireEvent.change(timeSelect, { target: { value: '12:30' } })
      
      const descriptionInput = screen.getByLabelText('Description (optionnel)')
      fireEvent.change(descriptionInput, { target: { value: 'Match test' } })
      
      const submitButton = screen.getByText('Créer le match')
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/matches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: '2024-01-15T12:30:00.000Z',
            maxPlayers: 12,
            description: 'Match test'
          })
        })
        expect(onSuccess).toHaveBeenCalledWith('Match créé avec succès')
      })
    })

    it('should create recurring matches', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            matches: [
              { id: 'match-1', date: new Date('2024-01-15T12:30:00.000Z') },
              { id: 'match-2', date: new Date('2024-01-22T12:30:00.000Z') },
              { id: 'match-3', date: new Date('2024-01-29T12:30:00.000Z') }
            ]
          }
        })
      })
      
      const onSuccess = jest.fn()
      render(<MatchCreationForm currentUser={mockCurrentUser} onSuccess={onSuccess} />)
      
      // Enable recurring
      const recurringCheckbox = screen.getByLabelText('Match récurrent')
      fireEvent.click(recurringCheckbox)
      
      await waitFor(() => {
        expect(screen.getByLabelText('Répéter chaque')).toBeInTheDocument()
      })
      
      // Fill form
      const dateInput = screen.getByLabelText('Date du match')
      fireEvent.change(dateInput, { target: { value: '2024-01-15' } })
      
      const repeatSelect = screen.getByLabelText('Répéter chaque')
      fireEvent.change(repeatSelect, { target: { value: 'week' } })
      
      const countInput = screen.getByLabelText('Nombre de matchs à créer')
      fireEvent.change(countInput, { target: { value: '3' } })
      
      const submitButton = screen.getByText('Créer les matchs')
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/matches/recurring', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: '2024-01-15T12:00:00.000Z',
            maxPlayers: 12,
            description: '',
            recurring: {
              frequency: 'week',
              count: 3
            }
          })
        })
        expect(onSuccess).toHaveBeenCalledWith('3 matchs récurrents créés avec succès')
      })
    })

    it('should handle API errors gracefully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({
          success: false,
          error: 'Un match existe déjà à cette date et heure'
        })
      })
      
      const onError = jest.fn()
      render(<MatchCreationForm currentUser={mockCurrentUser} onError={onError} />)
      
      const submitButton = screen.getByText('Créer le match')
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Un match existe déjà à cette date et heure')
      })
    })
  })

  describe('Loading States', () => {
    it('should show loading state during submission', async () => {
      ;(global.fetch as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      )
      
      render(<MatchCreationForm currentUser={mockCurrentUser} />)
      
      const submitButton = screen.getByText('Créer le match')
      fireEvent.click(submitButton)
      
      expect(screen.getByTestId('creation-loading')).toBeInTheDocument()
      expect(screen.getByText('Création en cours...')).toBeInTheDocument()
    })

    it('should disable form during submission', async () => {
      ;(global.fetch as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      )
      
      render(<MatchCreationForm currentUser={mockCurrentUser} />)
      
      const submitButton = screen.getByText('Créer le match')
      fireEvent.click(submitButton)
      
      expect(submitButton).toBeDisabled()
      expect(screen.getByLabelText('Date du match')).toBeDisabled()
    })
  })

  describe('Quick Actions', () => {
    it('should have quick preset buttons', () => {
      render(<MatchCreationForm currentUser={mockCurrentUser} />)
      
      expect(screen.getByText('Aujourd\'hui 12h')).toBeInTheDocument()
      expect(screen.getByText('Demain 12h')).toBeInTheDocument()
      expect(screen.getByText('Cette semaine')).toBeInTheDocument()
    })

    it('should apply quick preset correctly', async () => {
      const mockTomorrow = new Date('2024-01-15T12:00:00.000Z')
      jest.spyOn(global, 'Date').mockImplementation((args?: any) => {
        if (args) return new Date(args)
        return new Date('2024-01-14T10:00:00.000Z') // Mock "today"
      })
      
      render(<MatchCreationForm currentUser={mockCurrentUser} />)
      
      const tomorrowButton = screen.getByText('Demain 12h')
      fireEvent.click(tomorrowButton)
      
      const dateInput = screen.getByLabelText('Date du match') as HTMLInputElement
      const timeSelect = screen.getByLabelText('Heure de début') as HTMLSelectElement
      
      expect(dateInput.value).toBe('2024-01-15')
      expect(timeSelect.value).toBe('12:00')
    })
  })

  describe('Admin Permissions', () => {
    it('should prevent non-admin access', () => {
      const regularUser = { ...mockCurrentUser, role: 'user' as const }
      
      render(<MatchCreationForm currentUser={regularUser} />)
      
      expect(screen.getByText('Accès non autorisé')).toBeInTheDocument()
      expect(screen.queryByText('Créer le match')).not.toBeInTheDocument()
    })

    it('should show admin-only options', () => {
      render(<MatchCreationForm currentUser={mockCurrentUser} />)
      
      expect(screen.getByLabelText('Créer comme administrateur')).toBeInTheDocument()
      expect(screen.getByLabelText('Notifier les utilisateurs')).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should validate required fields', async () => {
      render(<MatchCreationForm currentUser={mockCurrentUser} />)
      
      // Clear date (required field)
      const dateInput = screen.getByLabelText('Date du match')
      fireEvent.change(dateInput, { target: { value: '' } })
      
      const submitButton = screen.getByText('Créer le match')
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('La date est obligatoire')).toBeInTheDocument()
      })
    })

    it('should validate max players range', async () => {
      render(<MatchCreationForm currentUser={mockCurrentUser} />)
      
      const maxPlayersInput = screen.getByLabelText('Nombre maximum de joueurs')
      fireEvent.change(maxPlayersInput, { target: { value: '15' } }) // > 12
      
      const submitButton = screen.getByText('Créer le match')
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Le nombre maximum de joueurs ne peut pas dépasser 12')).toBeInTheDocument()
      })
    })

    it('should validate minimum players', async () => {
      render(<MatchCreationForm currentUser={mockCurrentUser} />)
      
      const maxPlayersInput = screen.getByLabelText('Nombre maximum de joueurs')
      fireEvent.change(maxPlayersInput, { target: { value: '1' } }) // < 2
      
      const submitButton = screen.getByText('Créer le match')
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Il faut au moins 2 joueurs pour un match')).toBeInTheDocument()
      })
    })
  })
})