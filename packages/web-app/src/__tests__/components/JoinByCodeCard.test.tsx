/**
 * Tests for JoinByCodeCard component
 * Tests rendering, code validation, preview, and join functionality
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JoinByCodeCard } from '@/components/activities/JoinByCodeCard'
import { activitiesApi } from '@/lib/api'

// Mock the API
jest.mock('@/lib/api', () => ({
  activitiesApi: {
    getByCode: jest.fn(),
  },
}))

describe('JoinByCodeCard', () => {
  const mockOnJoin = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockOnJoin.mockReset()
  })

  describe('Rendering', () => {
    it('should render the card with title and description', () => {
      render(<JoinByCodeCard onJoin={mockOnJoin} />)

      expect(screen.getByText('Rejoindre avec un code')).toBeInTheDocument()
      expect(screen.getByText(/Entrez le code d'une activité/i)).toBeInTheDocument()
      expect(screen.getByText(/Vous avez reçu un code d'invitation/i)).toBeInTheDocument()
    })

    it('should render the key icon', () => {
      const { container } = render(<JoinByCodeCard onJoin={mockOnJoin} />)
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should render features list', () => {
      render(<JoinByCodeCard onJoin={mockOnJoin} />)

      expect(screen.getByText('Code de 8 caractères')).toBeInTheDocument()
      expect(screen.getByText('Accès sécurisé à l\'activité')).toBeInTheDocument()
    })

    it('should render "Entrer un code" button', () => {
      render(<JoinByCodeCard onJoin={mockOnJoin} />)

      expect(screen.getByRole('button', { name: /Entrer un code/i })).toBeInTheDocument()
    })
  })

  describe('Modal Opening', () => {
    it('should open modal when card is clicked', async () => {
      render(<JoinByCodeCard onJoin={mockOnJoin} />)

      const card = screen.getByText('Rejoindre avec un code').closest('div')?.parentElement
      fireEvent.click(card!)

      await waitFor(() => {
        expect(screen.getByText('Rejoindre une activité')).toBeInTheDocument()
      })
    })

    it('should open modal when button is clicked', async () => {
      render(<JoinByCodeCard onJoin={mockOnJoin} />)

      const button = screen.getByRole('button', { name: /Entrer un code/i })
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('Rejoindre une activité')).toBeInTheDocument()
      })
    })

    it('should show code input in modal', async () => {
      render(<JoinByCodeCard onJoin={mockOnJoin} />)

      const button = screen.getByRole('button', { name: /Entrer un code/i })
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Ex: A1B2C3D4')).toBeInTheDocument()
      })
    })
  })

  describe('Code Input', () => {
    beforeEach(async () => {
      render(<JoinByCodeCard onJoin={mockOnJoin} />)
      const button = screen.getByRole('button', { name: /Entrer un code/i })
      fireEvent.click(button)
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Ex: A1B2C3D4')).toBeInTheDocument()
      })
    })

    it('should sanitize code input (uppercase and remove spaces)', async () => {
      const input = screen.getByPlaceholderText('Ex: A1B2C3D4') as HTMLInputElement

      await userEvent.type(input, 'a1b2 c3d4')

      expect(input.value).toBe('A1B2C3D4')
    })

    it('should limit code input to 8 characters', async () => {
      const input = screen.getByPlaceholderText('Ex: A1B2C3D4') as HTMLInputElement

      await userEvent.type(input, 'A1B2C3D4EXTRA')

      expect(input.value).toBe('A1B2C3D4')
      expect(input.value).toHaveLength(8)
    })

    it('should remove special characters', async () => {
      const input = screen.getByPlaceholderText('Ex: A1B2C3D4') as HTMLInputElement

      await userEvent.type(input, 'A1-B2_C3@D4')

      expect(input.value).toBe('A1B2C3D4')
    })

    it('should enable verify button when code is 8 characters', async () => {
      const input = screen.getByPlaceholderText('Ex: A1B2C3D4')
      const verifyButton = screen.getByRole('button', { name: /Vérifier/i })

      expect(verifyButton).toBeDisabled()

      await userEvent.type(input, 'A1B2C3D4')

      expect(verifyButton).not.toBeDisabled()
    })

    it('should keep verify button disabled for incomplete codes', async () => {
      const input = screen.getByPlaceholderText('Ex: A1B2C3D4')
      const verifyButton = screen.getByRole('button', { name: /Vérifier/i })

      await userEvent.type(input, 'ABC123')

      expect(verifyButton).toBeDisabled()
    })
  })

  describe('Code Validation', () => {
    beforeEach(async () => {
      render(<JoinByCodeCard onJoin={mockOnJoin} />)
      const button = screen.getByRole('button', { name: /Entrer un code/i })
      fireEvent.click(button)
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Ex: A1B2C3D4')).toBeInTheDocument()
      })
    })

    it('should show error for empty code', async () => {
      const verifyButton = screen.getByRole('button', { name: /Vérifier/i })
      fireEvent.click(verifyButton)

      await waitFor(() => {
        expect(screen.getByText(/Veuillez saisir un code/i)).toBeInTheDocument()
      })
    })

    it('should show error for invalid code format', async () => {
      const input = screen.getByPlaceholderText('Ex: A1B2C3D4')

      // Force invalid input (bypassing sanitization by setting value directly)
      fireEvent.change(input, { target: { value: 'invalid' } })

      const verifyButton = screen.getByRole('button', { name: /Vérifier/i })
      fireEvent.click(verifyButton)

      await waitFor(() => {
        expect(screen.getByText(/Code invalide/i)).toBeInTheDocument()
      })
    })
  })

  describe('Activity Preview', () => {
    beforeEach(async () => {
      render(<JoinByCodeCard onJoin={mockOnJoin} />)
      const button = screen.getByRole('button', { name: /Entrer un code/i })
      fireEvent.click(button)
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Ex: A1B2C3D4')).toBeInTheDocument()
      })
    })

    it('should fetch and display activity preview on verify', async () => {
      const mockActivity = {
        name: 'Football du mardi',
        sport: 'football',
        creator: { pseudo: 'JohnDoe' },
        minPlayers: 8,
        maxPlayers: 12,
        recurringType: 'weekly'
      }

      ;(activitiesApi.getByCode as jest.Mock).mockResolvedValue({
        success: true,
        data: mockActivity
      })

      const input = screen.getByPlaceholderText('Ex: A1B2C3D4')
      await userEvent.type(input, 'A1B2C3D4')

      const verifyButton = screen.getByRole('button', { name: /Vérifier/i })
      fireEvent.click(verifyButton)

      await waitFor(() => {
        expect(screen.getByText('Football du mardi')).toBeInTheDocument()
        expect(screen.getByText(/football/i)).toBeInTheDocument()
        expect(screen.getByText(/JohnDoe/i)).toBeInTheDocument()
        expect(screen.getByText(/8-12/i)).toBeInTheDocument()
        expect(screen.getByText(/Hebdomadaire/i)).toBeInTheDocument()
      })
    })

    it('should show error when code is invalid', async () => {
      ;(activitiesApi.getByCode as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Code d\'activité invalide'
      })

      const input = screen.getByPlaceholderText('Ex: A1B2C3D4')
      await userEvent.type(input, 'INVALID1')

      const verifyButton = screen.getByRole('button', { name: /Vérifier/i })
      fireEvent.click(verifyButton)

      await waitFor(() => {
        expect(screen.getByText(/Code d'activité invalide/i)).toBeInTheDocument()
      })
    })

    it('should show loading state during verification', async () => {
      ;(activitiesApi.getByCode as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true, data: {} }), 100))
      )

      const input = screen.getByPlaceholderText('Ex: A1B2C3D4')
      await userEvent.type(input, 'A1B2C3D4')

      const verifyButton = screen.getByRole('button', { name: /Vérifier/i })
      fireEvent.click(verifyButton)

      expect(screen.getByText(/Vérification.../i)).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.queryByText(/Vérification.../i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Join Activity', () => {
    beforeEach(async () => {
      render(<JoinByCodeCard onJoin={mockOnJoin} />)
      const button = screen.getByRole('button', { name: /Entrer un code/i })
      fireEvent.click(button)
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Ex: A1B2C3D4')).toBeInTheDocument()
      })

      // Mock successful preview
      const mockActivity = {
        name: 'Football du mardi',
        sport: 'football',
        creator: { pseudo: 'JohnDoe' },
        minPlayers: 8,
        maxPlayers: 12,
        recurringType: 'weekly'
      }
      ;(activitiesApi.getByCode as jest.Mock).mockResolvedValue({
        success: true,
        data: mockActivity
      })

      const input = screen.getByPlaceholderText('Ex: A1B2C3D4')
      await userEvent.type(input, 'A1B2C3D4')

      const verifyButton = screen.getByRole('button', { name: /Vérifier/i })
      fireEvent.click(verifyButton)

      await waitFor(() => {
        expect(screen.getByText('Football du mardi')).toBeInTheDocument()
      })
    })

    it('should call onJoin when join button is clicked', async () => {
      mockOnJoin.mockResolvedValue({ success: true, message: 'Activité rejointe avec succès' })

      const joinButton = screen.getByRole('button', { name: /Rejoindre/i })
      fireEvent.click(joinButton)

      await waitFor(() => {
        expect(mockOnJoin).toHaveBeenCalledWith('A1B2C3D4')
      })
    })

    it('should close modal and show success message on successful join', async () => {
      mockOnJoin.mockResolvedValue({ success: true, message: 'Activité rejointe avec succès' })

      const joinButton = screen.getByRole('button', { name: /Rejoindre/i })
      fireEvent.click(joinButton)

      await waitFor(() => {
        expect(screen.getByText(/Activité rejointe avec succès/i)).toBeInTheDocument()
      })

      // Modal should close after delay
      await waitFor(() => {
        expect(screen.queryByText('Rejoindre une activité')).not.toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('should handle "already member" case', async () => {
      mockOnJoin.mockResolvedValue({
        success: true,
        message: 'Vous êtes déjà membre de cette activité'
      })

      const joinButton = screen.getByRole('button', { name: /Rejoindre/i })
      fireEvent.click(joinButton)

      await waitFor(() => {
        expect(screen.getByText(/Vous êtes déjà membre/i)).toBeInTheDocument()
        expect(screen.getByText(/déjà présente dans votre liste/i)).toBeInTheDocument()
      })

      // Modal should NOT auto-close for "already member"
      expect(screen.getByText('Rejoindre une activité')).toBeInTheDocument()
    })

    it('should show error when join fails', async () => {
      mockOnJoin.mockResolvedValue({
        success: false,
        error: 'Erreur lors de l\'inscription'
      })

      const joinButton = screen.getByRole('button', { name: /Rejoindre/i })
      fireEvent.click(joinButton)

      await waitFor(() => {
        expect(screen.getByText(/Erreur lors de l'inscription/i)).toBeInTheDocument()
      })
    })
  })

  describe('Modal Interactions', () => {
    beforeEach(async () => {
      render(<JoinByCodeCard onJoin={mockOnJoin} />)
      const button = screen.getByRole('button', { name: /Entrer un code/i })
      fireEvent.click(button)
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Ex: A1B2C3D4')).toBeInTheDocument()
      })
    })

    it('should close modal when close button is clicked', async () => {
      const closeButton = screen.getByRole('button', { name: '' }).closest('button')
      fireEvent.click(closeButton!)

      await waitFor(() => {
        expect(screen.queryByText('Rejoindre une activité')).not.toBeInTheDocument()
      })
    })

    it('should close modal when cancel button is clicked', async () => {
      const cancelButton = screen.getByRole('button', { name: /Annuler/i })
      fireEvent.click(cancelButton)

      await waitFor(() => {
        expect(screen.queryByText('Rejoindre une activité')).not.toBeInTheDocument()
      })
    })

    it('should clear code when modal is closed', async () => {
      const input = screen.getByPlaceholderText('Ex: A1B2C3D4') as HTMLInputElement
      await userEvent.type(input, 'A1B2C3D4')

      const cancelButton = screen.getByRole('button', { name: /Annuler/i })
      fireEvent.click(cancelButton)

      // Reopen modal
      const button = screen.getByRole('button', { name: /Entrer un code/i })
      fireEvent.click(button)

      await waitFor(() => {
        const newInput = screen.getByPlaceholderText('Ex: A1B2C3D4') as HTMLInputElement
        expect(newInput.value).toBe('')
      })
    })

    it('should show back button after preview', async () => {
      const mockActivity = {
        name: 'Football du mardi',
        sport: 'football',
        creator: { pseudo: 'JohnDoe' },
        minPlayers: 8,
        maxPlayers: 12,
        recurringType: 'weekly'
      }
      ;(activitiesApi.getByCode as jest.Mock).mockResolvedValue({
        success: true,
        data: mockActivity
      })

      const input = screen.getByPlaceholderText('Ex: A1B2C3D4')
      await userEvent.type(input, 'A1B2C3D4')

      const verifyButton = screen.getByRole('button', { name: /Vérifier/i })
      fireEvent.click(verifyButton)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Retour/i })).toBeInTheDocument()
      })
    })

    it('should go back to code input when back button is clicked', async () => {
      const mockActivity = {
        name: 'Football du mardi',
        sport: 'football',
        creator: { pseudo: 'JohnDoe' },
        minPlayers: 8,
        maxPlayers: 12,
        recurringType: 'weekly'
      }
      ;(activitiesApi.getByCode as jest.Mock).mockResolvedValue({
        success: true,
        data: mockActivity
      })

      const input = screen.getByPlaceholderText('Ex: A1B2C3D4')
      await userEvent.type(input, 'A1B2C3D4')

      const verifyButton = screen.getByRole('button', { name: /Vérifier/i })
      fireEvent.click(verifyButton)

      await waitFor(() => {
        expect(screen.getByText('Football du mardi')).toBeInTheDocument()
      })

      const backButton = screen.getByRole('button', { name: /Retour/i })
      fireEvent.click(backButton)

      await waitFor(() => {
        expect(screen.queryByText('Football du mardi')).not.toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Vérifier/i })).toBeInTheDocument()
      })
    })
  })
})
