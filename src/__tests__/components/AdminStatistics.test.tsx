import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import AdminStatistics from '../../components/admin/AdminStatistics'

// Mock fetch globally
global.fetch = jest.fn()

const mockStats = {
  users: {
    total: 15,
    active: 12,
    admins: 2
  },
  matches: {
    total: 25,
    open: 3,
    full: 2,
    completed: 18,
    cancelled: 2
  },
  activity: {
    totalPlayers: 45,
    averagePlayersPerMatch: 8.5,
    mostActiveUser: {
      pseudo: 'Player1',
      matchCount: 12
    }
  },
  recentActivity: [
    {
      id: 'activity-1',
      type: 'match_join',
      user: { pseudo: 'Player1' },
      match: { date: new Date('2024-01-10T12:30:00.000Z') },
      timestamp: new Date('2024-01-10T10:00:00.000Z')
    },
    {
      id: 'activity-2', 
      type: 'match_leave',
      user: { pseudo: 'Player2' },
      match: { date: new Date('2024-01-09T13:00:00.000Z') },
      timestamp: new Date('2024-01-09T11:00:00.000Z')
    }
  ]
}

const mockCurrentUser = {
  id: 'admin-1',
  pseudo: 'Admin',
  role: 'root' as const
}

describe('AdminStatistics Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: mockStats
      })
    })
  })

  describe('Statistics Display', () => {
    it('should render main statistics cards', async () => {
      render(<AdminStatistics currentUser={mockCurrentUser} />)
      
      await waitFor(() => {
        expect(screen.getByText('Statistiques globales')).toBeInTheDocument()
        expect(screen.getByText('15')).toBeInTheDocument() // Total users
        expect(screen.getByText('25')).toBeInTheDocument() // Total matches
        expect(screen.getByText('45')).toBeInTheDocument() // Total players
      })
    })

    it('should display user statistics', async () => {
      render(<AdminStatistics currentUser={mockCurrentUser} />)
      
      await waitFor(() => {
        expect(screen.getByText('Utilisateurs')).toBeInTheDocument()
        expect(screen.getByText('15 total')).toBeInTheDocument()
        expect(screen.getByText('12 actifs')).toBeInTheDocument()
        expect(screen.getByText('2 administrateurs')).toBeInTheDocument()
      })
    })

    it('should display match statistics', async () => {
      render(<AdminStatistics currentUser={mockCurrentUser} />)
      
      await waitFor(() => {
        expect(screen.getByText('Matchs')).toBeInTheDocument()
        expect(screen.getByText('25 total')).toBeInTheDocument()
        expect(screen.getByText('3 ouverts')).toBeInTheDocument()
        expect(screen.getByText('2 complets')).toBeInTheDocument()
        expect(screen.getByText('18 terminés')).toBeInTheDocument()
        expect(screen.getByText('2 annulés')).toBeInTheDocument()
      })
    })

    it('should show activity metrics', async () => {
      render(<AdminStatistics currentUser={mockCurrentUser} />)
      
      await waitFor(() => {
        expect(screen.getByText('Activité')).toBeInTheDocument()
        expect(screen.getByText('45 joueurs inscrits')).toBeInTheDocument()
        expect(screen.getByText('8.5 joueurs/match en moyenne')).toBeInTheDocument()
        expect(screen.getByText('Player1 (12 matchs)')).toBeInTheDocument()
      })
    })
  })

  describe('Recent Activity Feed', () => {
    it('should display recent activity section', async () => {
      render(<AdminStatistics currentUser={mockCurrentUser} />)
      
      await waitFor(() => {
        expect(screen.getByText('Activité récente')).toBeInTheDocument()
        expect(screen.getByText('Player1 a rejoint un match')).toBeInTheDocument()
        expect(screen.getByText('Player2 a quitté un match')).toBeInTheDocument()
      })
    })

    it('should format activity timestamps', async () => {
      render(<AdminStatistics currentUser={mockCurrentUser} />)
      
      await waitFor(() => {
        expect(screen.getByText('il y a')).toBeInTheDocument()
      })
    })

    it('should show match dates in activity', async () => {
      render(<AdminStatistics currentUser={mockCurrentUser} />)
      
      await waitFor(() => {
        expect(screen.getByText('10 janvier 12:30')).toBeInTheDocument()
        expect(screen.getByText('9 janvier 13:00')).toBeInTheDocument()
      })
    })
  })

  describe('Charts and Visualizations', () => {
    it('should display match status distribution chart', async () => {
      render(<AdminStatistics currentUser={mockCurrentUser} />)
      
      await waitFor(() => {
        expect(screen.getByTestId('match-status-chart')).toBeInTheDocument()
      })
    })

    it('should show user activity over time', async () => {
      render(<AdminStatistics currentUser={mockCurrentUser} />)
      
      await waitFor(() => {
        expect(screen.getByTestId('activity-timeline')).toBeInTheDocument()
      })
    })

    it('should display weekly match frequency', async () => {
      render(<AdminStatistics currentUser={mockCurrentUser} />)
      
      await waitFor(() => {
        expect(screen.getByText('Fréquence des matchs')).toBeInTheDocument()
        expect(screen.getByTestId('weekly-frequency-chart')).toBeInTheDocument()
      })
    })
  })

  describe('Real-time Updates', () => {
    it('should refresh statistics automatically', async () => {
      jest.useFakeTimers()
      
      render(<AdminStatistics currentUser={mockCurrentUser} />)
      
      await waitFor(() => {
        expect(screen.getByText('15')).toBeInTheDocument()
      })

      // Clear previous calls
      jest.clearAllMocks()
      
      // Advance timers to trigger refresh
      jest.advanceTimersByTime(30000) // 30 seconds
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/admin/statistics')
      })

      jest.useRealTimers()
    })

    it('should show last updated timestamp', async () => {
      render(<AdminStatistics currentUser={mockCurrentUser} />)
      
      await waitFor(() => {
        expect(screen.getByText(/Dernière mise à jour:/)).toBeInTheDocument()
      })
    })
  })

  describe('Export Functionality', () => {
    it('should have export buttons', async () => {
      render(<AdminStatistics currentUser={mockCurrentUser} />)
      
      await waitFor(() => {
        expect(screen.getByText('Exporter CSV')).toBeInTheDocument()
        expect(screen.getByText('Exporter PDF')).toBeInTheDocument()
      })
    })

    it('should handle CSV export', async () => {
      // Mock URL.createObjectURL
      const mockCreateObjectURL = jest.fn(() => 'blob:mock-url')
      global.URL.createObjectURL = mockCreateObjectURL

      render(<AdminStatistics currentUser={mockCurrentUser} />)
      
      await waitFor(() => {
        const exportButton = screen.getByText('Exporter CSV')
        fireEvent.click(exportButton)
      })

      expect(mockCreateObjectURL).toHaveBeenCalled()
    })
  })

  describe('Filters and Time Range', () => {
    it('should have time range selector', async () => {
      render(<AdminStatistics currentUser={mockCurrentUser} />)
      
      await waitFor(() => {
        expect(screen.getByText('Période')).toBeInTheDocument()
        expect(screen.getByText('7 derniers jours')).toBeInTheDocument()
        expect(screen.getByText('30 derniers jours')).toBeInTheDocument()
        expect(screen.getByText('3 derniers mois')).toBeInTheDocument()
      })
    })

    it('should update statistics when time range changes', async () => {
      render(<AdminStatistics currentUser={mockCurrentUser} />)
      
      await waitFor(() => {
        expect(screen.getByText('30 derniers jours')).toBeInTheDocument()
      })

      const timeRangeSelector = screen.getByText('30 derniers jours')
      fireEvent.click(timeRangeSelector)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/statistics?range=30d'
        )
      })
    })
  })

  describe('Loading and Error States', () => {
    it('should show loading state initially', () => {
      ;(global.fetch as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      )

      render(<AdminStatistics currentUser={mockCurrentUser} />)
      
      expect(screen.getByText('Chargement des statistiques...')).toBeInTheDocument()
      expect(screen.getByTestId('statistics-loading')).toBeInTheDocument()
    })

    it('should handle API errors gracefully', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      const onError = jest.fn()
      render(<AdminStatistics currentUser={mockCurrentUser} onError={onError} />)
      
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Erreur lors du chargement des statistiques')
      })
    })

    it('should show retry button on error', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      render(<AdminStatistics currentUser={mockCurrentUser} />)
      
      await waitFor(() => {
        expect(screen.getByText('Erreur de chargement')).toBeInTheDocument()
        expect(screen.getByText('Réessayer')).toBeInTheDocument()
      })
    })

    it('should handle empty data gracefully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            users: { total: 0, active: 0, admins: 0 },
            matches: { total: 0, open: 0, full: 0, completed: 0, cancelled: 0 },
            activity: { totalPlayers: 0, averagePlayersPerMatch: 0 },
            recentActivity: []
          }
        })
      })

      render(<AdminStatistics currentUser={mockCurrentUser} />)
      
      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument()
        expect(screen.getByText('Aucune activité récente')).toBeInTheDocument()
      })
    })
  })

  describe('Permissions', () => {
    it('should prevent non-admin access', () => {
      const regularUser = { ...mockCurrentUser, role: 'user' as const }
      
      render(<AdminStatistics currentUser={regularUser} />)
      
      expect(screen.getByText('Accès non autorisé')).toBeInTheDocument()
      expect(screen.queryByText('Statistiques globales')).not.toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('should adapt layout for mobile', () => {
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })

      render(<AdminStatistics currentUser={mockCurrentUser} />)
      
      expect(screen.getByTestId('mobile-stats-layout')).toBeInTheDocument()
    })

    it('should show desktop layout on large screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024
      })

      render(<AdminStatistics currentUser={mockCurrentUser} />)
      
      expect(screen.getByTestId('desktop-stats-layout')).toBeInTheDocument()
    })
  })
})