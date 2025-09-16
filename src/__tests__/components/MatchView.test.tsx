import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import MatchView from '../../components/matches/MatchView'

// Mock fetch globally
global.fetch = jest.fn()

// Mock data
const mockMatch = {
  id: 'match-1',
  date: new Date('2024-01-08T12:30:00.000Z'),
  maxPlayers: 12,
  status: 'open' as const,
  players: [
    {
      id: 'player-1',
      userId: 'user-1',
      matchId: 'match-1',
      status: 'confirmed' as const,
      joinedAt: new Date('2024-01-01T10:00:00.000Z'),
      user: {
        id: 'user-1',
        pseudo: 'Player1',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Player1'
      }
    },
    {
      id: 'player-2',
      userId: 'user-2', 
      matchId: 'match-1',
      status: 'confirmed' as const,
      joinedAt: new Date('2024-01-01T10:01:00.000Z'),
      user: {
        id: 'user-2',
        pseudo: 'Player2',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Player2'
      }
    }
  ],
  waitingList: [
    {
      id: 'player-3',
      userId: 'user-3',
      matchId: 'match-1', 
      status: 'waiting' as const,
      joinedAt: new Date('2024-01-01T10:02:00.000Z'),
      user: {
        id: 'user-3',
        pseudo: 'Player3',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Player3'
      }
    }
  ]
}

const mockCurrentUser = {
  id: 'user-1',
  pseudo: 'Player1',
  role: 'user' as const
}

describe('MatchView Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Layout and Display', () => {
    it('should render match information', () => {
      render(<MatchView match={mockMatch} currentUser={mockCurrentUser} />)
      
      expect(screen.getByText('Lundi 8 janvier')).toBeInTheDocument()
      expect(screen.getByText('13:30')).toBeInTheDocument() // UTC time shows as 13:30 local
      expect(screen.getByText('2/12 joueurs')).toBeInTheDocument()
    })

    it('should display 6v6 field layout', () => {
      render(<MatchView match={mockMatch} currentUser={mockCurrentUser} />)
      
      // Check for field layout elements
      expect(screen.getByTestId('football-field')).toBeInTheDocument()
      expect(screen.getByTestId('team-a-side')).toBeInTheDocument()
      expect(screen.getByTestId('team-b-side')).toBeInTheDocument()
      
      // Check for positions (6 per team)
      const positions = screen.getAllByTestId(/^position-/)
      expect(positions).toHaveLength(12) // 6v6 = 12 positions
    })

    it('should render confirmed players with avatars', () => {
      render(<MatchView match={mockMatch} currentUser={mockCurrentUser} />)
      
      expect(screen.getByText('Player1')).toBeInTheDocument()
      expect(screen.getByText('Player2')).toBeInTheDocument()
      
      // Check specifically for confirmed players avatars in the field (48x48 pixels)
      const confirmedAvatars = screen.getAllByRole('img').filter(img => 
        img.getAttribute('width') === '48' && /Player\d avatar/.test(img.getAttribute('alt') || '')
      )
      expect(confirmedAvatars).toHaveLength(2)
    })

    it('should show empty positions for missing players', () => {
      render(<MatchView match={mockMatch} currentUser={mockCurrentUser} />)
      
      // Should have 10 empty positions (12 total - 2 filled)
      const emptyPositions = screen.getAllByTestId('empty-position')
      expect(emptyPositions).toHaveLength(10)
    })

    it('should display waiting list section', () => {
      render(<MatchView match={mockMatch} currentUser={mockCurrentUser} />)
      
      expect(screen.getByText('Liste d\'attente')).toBeInTheDocument()
      expect(screen.getByText('Player3')).toBeInTheDocument()
      expect(screen.getByText('1ère position')).toBeInTheDocument()
    })
  })

  describe('Player Distribution', () => {
    it('should distribute players evenly between teams', () => {
      const matchWithManyPlayers = {
        ...mockMatch,
        players: Array.from({ length: 10 }, (_, i) => ({
          id: `player-${i + 1}`,
          userId: `user-${i + 1}`,
          matchId: 'match-1',
          status: 'confirmed' as const,
          joinedAt: new Date(`2024-01-01T10:0${i}:00.000Z`),
          user: {
            id: `user-${i + 1}`,
            pseudo: `Player${i + 1}`,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=Player${i + 1}`
          }
        }))
      }

      render(<MatchView match={matchWithManyPlayers} currentUser={mockCurrentUser} />)
      
      // Team A should have 5 players, Team B should have 5 players
      const teamAPlayers = screen.getAllByTestId(/^team-a-player-/)
      const teamBPlayers = screen.getAllByTestId(/^team-b-player-/)
      
      expect(teamAPlayers).toHaveLength(5)
      expect(teamBPlayers).toHaveLength(5)
    })

    it('should handle odd number of players', () => {
      const matchWithOddPlayers = {
        ...mockMatch,
        players: Array.from({ length: 7 }, (_, i) => ({
          id: `player-${i + 1}`,
          userId: `user-${i + 1}`,
          matchId: 'match-1',
          status: 'confirmed' as const,
          joinedAt: new Date(`2024-01-01T10:0${i}:00.000Z`),
          user: {
            id: `user-${i + 1}`,
            pseudo: `Player${i + 1}`,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=Player${i + 1}`
          }
        }))
      }

      render(<MatchView match={matchWithOddPlayers} currentUser={mockCurrentUser} />)
      
      // Team A should have 4 players, Team B should have 3 players (or vice versa)
      const teamAPlayers = screen.getAllByTestId(/^team-a-player-/)
      const teamBPlayers = screen.getAllByTestId(/^team-b-player-/)
      
      expect(teamAPlayers.length + teamBPlayers.length).toBe(7)
      expect(Math.abs(teamAPlayers.length - teamBPlayers.length)).toBeLessThanOrEqual(1)
    })
  })

  describe('User Interactions', () => {
    it('should show leave option when clicking own avatar', async () => {
      render(<MatchView match={mockMatch} currentUser={mockCurrentUser} />)
      
      const ownAvatar = screen.getByRole('img', { name: 'Player1 avatar' })
      fireEvent.click(ownAvatar)
      
      await waitFor(() => {
        expect(screen.getByText('Quitter le match')).toBeInTheDocument()
      })
    })

    it('should not show leave option when clicking other player avatar', async () => {
      render(<MatchView match={mockMatch} currentUser={mockCurrentUser} />)
      
      const otherAvatar = screen.getByRole('img', { name: 'Player2 avatar' })
      fireEvent.click(otherAvatar)
      
      // Should not show leave option
      await waitFor(() => {
        expect(screen.queryByText('Quitter le match')).not.toBeInTheDocument()
      })
    })

    it('should allow leaving match from waiting list', async () => {
      const currentUserInWaitingList = {
        id: 'user-3',
        pseudo: 'Player3',
        role: 'user' as const
      }

      render(<MatchView match={mockMatch} currentUser={currentUserInWaitingList} />)
      
      const waitingAvatar = screen.getByRole('img', { name: 'Player3 avatar' })
      fireEvent.click(waitingAvatar)
      
      await waitFor(() => {
        expect(screen.getByText('Quitter la liste d\'attente')).toBeInTheDocument()
      })
    })

    it('should handle leave match action', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Match quitté avec succès' })
      })

      const onMatchUpdate = jest.fn()
      render(
        <MatchView 
          match={mockMatch} 
          currentUser={mockCurrentUser} 
          onMatchUpdate={onMatchUpdate}
        />
      )
      
      const ownAvatar = screen.getByRole('img', { name: 'Player1 avatar' })
      fireEvent.click(ownAvatar)
      
      await waitFor(() => {
        const leaveButton = screen.getByText('Quitter le match')
        fireEvent.click(leaveButton)
      })
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/matches/match-1/leave',
          expect.objectContaining({
            method: 'DELETE'
          })
        )
        expect(onMatchUpdate).toHaveBeenCalled()
      })
    })
  })

  describe('Match States', () => {
    it('should show full match indicator when at capacity', () => {
      const fullMatch = {
        ...mockMatch,
        status: 'full' as const,
        players: Array.from({ length: 12 }, (_, i) => ({
          id: `player-${i + 1}`,
          userId: `user-${i + 1}`,
          matchId: 'match-1',
          status: 'confirmed' as const,
          joinedAt: new Date(`2024-01-01T10:0${i}:00.000Z`),
          user: {
            id: `user-${i + 1}`,
            pseudo: `Player${i + 1}`,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=Player${i + 1}`
          }
        }))
      }

      render(<MatchView match={fullMatch} currentUser={mockCurrentUser} />)
      
      expect(screen.getByText('Match complet')).toBeInTheDocument()
      expect(screen.getByText('12/12 joueurs')).toBeInTheDocument()
    })

    it('should show empty match state', () => {
      const emptyMatch = {
        ...mockMatch,
        players: [],
        waitingList: []
      }

      render(<MatchView match={emptyMatch} currentUser={mockCurrentUser} />)
      
      expect(screen.getByText('Aucun joueur inscrit')).toBeInTheDocument()
      expect(screen.getByText('Soyez le premier à rejoindre ce match !')).toBeInTheDocument()
    })

    it('should show cancelled match state', () => {
      const cancelledMatch = {
        ...mockMatch,
        status: 'cancelled' as const
      }

      render(<MatchView match={cancelledMatch} currentUser={mockCurrentUser} />)
      
      expect(screen.getByText('Match annulé')).toBeInTheDocument()
      expect(screen.getByTestId('cancelled-indicator')).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('should render mobile layout on small screens', () => {
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })

      render(<MatchView match={mockMatch} currentUser={mockCurrentUser} />)
      
      expect(screen.getByTestId('mobile-layout')).toBeInTheDocument()
      expect(screen.queryByTestId('desktop-layout')).not.toBeInTheDocument()
    })

    it('should render desktop layout on large screens', () => {
      // Mock window.innerWidth  
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024
      })

      render(<MatchView match={mockMatch} currentUser={mockCurrentUser} />)
      
      expect(screen.getByTestId('desktop-layout')).toBeInTheDocument()
      expect(screen.queryByTestId('mobile-layout')).not.toBeInTheDocument()
    })
  })

  describe('Admin Features', () => {
    it('should show admin controls for root users', () => {
      const adminUser = {
        ...mockCurrentUser,
        role: 'root' as const
      }

      render(<MatchView match={mockMatch} currentUser={adminUser} />)
      
      expect(screen.getByText('Actions administrateur')).toBeInTheDocument()
      expect(screen.getByText('Forcer inscription')).toBeInTheDocument()
      expect(screen.getByText('Remplacer joueur')).toBeInTheDocument()
    })

    it('should not show admin controls for regular users', () => {
      render(<MatchView match={mockMatch} currentUser={mockCurrentUser} />)
      
      expect(screen.queryByText('Actions administrateur')).not.toBeInTheDocument()
      expect(screen.queryByText('Forcer inscription')).not.toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      const onError = jest.fn()
      render(
        <MatchView 
          match={mockMatch} 
          currentUser={mockCurrentUser} 
          onError={onError}
        />
      )
      
      const ownAvatar = screen.getByRole('img', { name: 'Player1 avatar' })
      fireEvent.click(ownAvatar)
      
      await waitFor(() => {
        const leaveButton = screen.getByText('Quitter le match')
        fireEvent.click(leaveButton)
      })
      
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Erreur lors de l\'action')
      })
    })

    it('should show loading state during actions', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ success: true })
        }), 100))
      )

      render(<MatchView match={mockMatch} currentUser={mockCurrentUser} />)
      
      const ownAvatar = screen.getByRole('img', { name: 'Player1 avatar' })
      fireEvent.click(ownAvatar)
      
      await waitFor(() => {
        const leaveButton = screen.getByText('Quitter le match')
        fireEvent.click(leaveButton)
      })
      
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument()
    })
  })
})