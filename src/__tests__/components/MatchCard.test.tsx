import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MatchCard } from '@/components/matches/MatchCard'

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    return <img {...props} alt={props.alt} />
  },
}))

// Mock fetch
global.fetch = jest.fn()

describe('MatchCard Component', () => {
  const user = userEvent.setup()
  
  const mockMatch = {
    id: 'match-1',
    date: new Date('2024-01-15T12:00:00Z'),
    maxPlayers: 12,
    status: 'open' as const,
    players: [
      {
        id: 'player-1',
        user: {
          id: 'user-1',
          pseudo: 'Player1',
          avatar: null
        },
        status: 'confirmed' as const,
        joinedAt: new Date('2024-01-14T10:00:00Z')
      },
      {
        id: 'player-2',
        user: {
          id: 'user-2',
          pseudo: 'Player2',
          avatar: 'https://example.com/avatar.jpg'
        },
        status: 'confirmed' as const,
        joinedAt: new Date('2024-01-14T11:00:00Z')
      }
    ],
    waitingList: [
      {
        id: 'waiting-1',
        user: {
          id: 'user-3',
          pseudo: 'WaitingPlayer',
          avatar: null
        },
        status: 'waiting' as const,
        joinedAt: new Date('2024-01-14T12:00:00Z')
      }
    ]
  }

  const mockCurrentUser = {
    id: 'current-user',
    email: 'current@example.com',
    pseudo: 'CurrentUser',
    role: 'user' as const
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  it('should render match information correctly', () => {
    render(<MatchCard match={mockMatch} currentUser={mockCurrentUser} />)

    expect(screen.getByText(/15 janvier 2024/i)).toBeInTheDocument()
    expect(screen.getByText(/13:00/i)).toBeInTheDocument() // UTC+1 for local display
    expect(screen.getByText(/2 \/ 12 joueurs/i)).toBeInTheDocument()
    expect(screen.getByText(/1 en attente/i)).toBeInTheDocument()
  })

  it('should show player avatars', () => {
    render(<MatchCard match={mockMatch} currentUser={mockCurrentUser} />)

    const avatars = screen.getAllByAltText(/avatar/i)
    expect(avatars).toHaveLength(3) // 2 confirmed + 1 waiting
  })

  it('should show join button when user is not in match', () => {
    render(<MatchCard match={mockMatch} currentUser={mockCurrentUser} />)

    expect(screen.getByRole('button', { name: /rejoindre/i })).toBeInTheDocument()
  })

  it('should show leave button when user is in match', () => {
    const matchWithCurrentUser = {
      ...mockMatch,
      players: [
        ...mockMatch.players,
        {
          id: 'current-player',
          user: mockCurrentUser,
          status: 'confirmed' as const,
          joinedAt: new Date('2024-01-14T13:00:00Z')
        }
      ]
    }

    render(<MatchCard match={matchWithCurrentUser} currentUser={mockCurrentUser} />)

    expect(screen.getByRole('button', { name: /quitter/i })).toBeInTheDocument()
  })

  it('should show waiting list position when user is in waiting list', () => {
    const matchWithCurrentUserWaiting = {
      ...mockMatch,
      waitingList: [
        ...mockMatch.waitingList,
        {
          id: 'current-waiting',
          user: mockCurrentUser,
          status: 'waiting' as const,
          joinedAt: new Date('2024-01-14T14:00:00Z')
        }
      ]
    }

    render(<MatchCard match={matchWithCurrentUserWaiting} currentUser={mockCurrentUser} />)

    expect(screen.getByText(/position 2 en liste d'attente/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /quitter la liste d'attente/i })).toBeInTheDocument()
  })

  it('should handle join match action', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    })

    const mockOnUpdate = jest.fn()
    render(<MatchCard match={mockMatch} currentUser={mockCurrentUser} onUpdate={mockOnUpdate} />)

    const joinButton = screen.getByRole('button', { name: /rejoindre/i })
    await user.click(joinButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(`/api/matches/${mockMatch.id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
    })

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalled()
    })
  })

  it('should handle leave match action', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    })

    const matchWithCurrentUser = {
      ...mockMatch,
      players: [
        ...mockMatch.players,
        {
          id: 'current-player',
          user: mockCurrentUser,
          status: 'confirmed' as const,
          joinedAt: new Date('2024-01-14T13:00:00Z')
        }
      ]
    }

    const mockOnUpdate = jest.fn()
    render(<MatchCard match={matchWithCurrentUser} currentUser={mockCurrentUser} onUpdate={mockOnUpdate} />)

    const leaveButton = screen.getByRole('button', { name: /quitter/i })
    await user.click(leaveButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(`/api/matches/${mockMatch.id}/leave`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })
    })

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalled()
    })
  })

  it('should show loading state during action', async () => {
    ;(global.fetch as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 1000))
    )

    render(<MatchCard match={mockMatch} currentUser={mockCurrentUser} />)

    const joinButton = screen.getByRole('button', { name: /rejoindre/i })
    await user.click(joinButton)

    await waitFor(() => {
      expect(screen.getByText(/rejoindre.../i)).toBeInTheDocument()
      expect(joinButton).toBeDisabled()
    })
  })

  it('should handle errors gracefully', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

    render(<MatchCard match={mockMatch} currentUser={mockCurrentUser} />)

    const joinButton = screen.getByRole('button', { name: /rejoindre/i })
    await user.click(joinButton)

    await waitFor(() => {
      expect(screen.getByText(/erreur lors de l'action/i)).toBeInTheDocument()
    })
  })

  it('should show match as full when at capacity', () => {
    const fullMatch = {
      ...mockMatch,
      players: Array.from({ length: 12 }, (_, i) => ({
        id: `player-${i}`,
        user: {
          id: `user-${i}`,
          pseudo: `Player${i}`,
          avatar: null
        },
        status: 'confirmed' as const,
        joinedAt: new Date('2024-01-14T10:00:00Z')
      }))
    }

    render(<MatchCard match={fullMatch} currentUser={mockCurrentUser} />)

    expect(screen.getByText(/match complet/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /rejoindre la liste d'attente/i })).toBeInTheDocument()
  })

  it('should show cancelled match status', () => {
    const cancelledMatch = {
      ...mockMatch,
      status: 'cancelled' as const
    }

    render(<MatchCard match={cancelledMatch} currentUser={mockCurrentUser} />)

    expect(screen.getByText(/annulé/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /rejoindre/i })).not.toBeInTheDocument()
  })

  it('should format date and time correctly', () => {
    const match = {
      ...mockMatch,
      date: new Date('2024-12-25T14:30:00Z')
    }

    render(<MatchCard match={match} currentUser={mockCurrentUser} />)

    expect(screen.getByText(/25 décembre 2024/i)).toBeInTheDocument()
    expect(screen.getByText(/15:30/i)).toBeInTheDocument()
  })

  it('should limit displayed players and show more indicator', () => {
    const matchWithManyPlayers = {
      ...mockMatch,
      players: Array.from({ length: 8 }, (_, i) => ({
        id: `player-${i}`,
        user: {
          id: `user-${i}`,
          pseudo: `Player${i}`,
          avatar: null
        },
        status: 'confirmed' as const,
        joinedAt: new Date('2024-01-14T10:00:00Z')
      }))
    }

    render(<MatchCard match={matchWithManyPlayers} currentUser={mockCurrentUser} />)

    const avatars = screen.getAllByAltText(/avatar/i)
    expect(avatars.length).toBeLessThanOrEqual(6) // Should limit display
    expect(screen.getByText(/\+2/)).toBeInTheDocument() // Should show remaining count
  })
})