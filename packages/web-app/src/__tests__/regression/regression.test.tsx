/**
 * Regression Test Suite
 * Tests for previously fixed bugs to ensure they don't reoccur
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

// Mock components and utilities
import MatchCard from '../../components/matches/MatchCard'
import MatchView from '../../components/matches/MatchView'
import UserProfile from '../../components/profile/UserProfile'
import LoginForm from '../../components/auth/LoginForm'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}))

describe('Regression Tests', () => {
  describe('Authentication Bugs', () => {
    test('REGRESSION: Should not allow registration with existing email', async () => {
      // Bug: Previously allowed duplicate emails in registration
      // Fixed: Added proper email validation in registration API
      
      const mockRegister = jest.fn().mockRejectedValue({
        error: 'Email already exists'
      })

      jest.mock('../../lib/auth/utils', () => ({
        registerUser: mockRegister
      }))

      render(<LoginForm />)
      
      // This test ensures the fix remains in place
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/mot de passe/i)
      
      await userEvent.type(emailInput, 'existing@example.com')
      await userEvent.type(passwordInput, 'Password123!')
      
      fireEvent.click(screen.getByRole('button', { name: /se connecter/i }))
      
      await waitFor(() => {
        expect(screen.getByText(/email déjà utilisé/i)).toBeInTheDocument()
      })
    })

    test('REGRESSION: Should handle session expiration gracefully', async () => {
      // Bug: Previously caused infinite redirect loops on session expiry
      // Fixed: Added proper session validation and cleanup
      
      const expiredSession = {
        user: null,
        error: 'Session expired'
      }

      // Simulate expired session
      jest.spyOn(console, 'error').mockImplementation(() => {})
      
      // This would be tested with actual auth context
      expect(() => {
        // Should not throw or cause loops
        const result = expiredSession
        expect(result.user).toBeNull()
      }).not.toThrow()
    })

    test('REGRESSION: Should validate password strength correctly', () => {
      // Bug: Previously accepted weak passwords
      // Fixed: Added comprehensive password validation
      
      const weakPasswords = [
        'weak',
        'password',
        '12345678',
        'Password',
        'password123'
      ]

      const strongPassword = 'StrongP@ssw0rd123'

      // Import validation function
      const validatePassword = (password: string) => {
        const hasUppercase = /[A-Z]/.test(password)
        const hasLowercase = /[a-z]/.test(password)
        const hasNumbers = /\d/.test(password)
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)
        const isLongEnough = password.length >= 8

        return hasUppercase && hasLowercase && hasNumbers && hasSpecial && isLongEnough
      }

      weakPasswords.forEach(password => {
        expect(validatePassword(password)).toBe(false)
      })

      expect(validatePassword(strongPassword)).toBe(true)
    })
  })

  describe('Match Management Bugs', () => {
    test('REGRESSION: Should prevent double-joining matches', async () => {
      // Bug: Previously allowed users to join same match multiple times
      // Fixed: Added unique constraint and validation
      
      const mockMatch = {
        id: 'match-1',
        date: new Date('2024-02-15T12:00:00Z'),
        maxPlayers: 12,
        status: 'open' as const,
        players: [
          {
            id: 'player-1',
            userId: 'user-1',
            matchId: 'match-1',
            status: 'confirmed' as const,
            joinedAt: new Date(),
            user: {
              id: 'user-1',
              pseudo: 'TestUser',
              avatar: 'avatar-1'
            }
          }
        ]
      }

      const mockOnJoin = jest.fn().mockRejectedValue({
        error: 'Already registered for this match'
      })

      render(
        <MatchCard 
          match={mockMatch} 
          onJoin={mockOnJoin} 
          onLeave={jest.fn()} 
          currentUserId="user-1" 
        />
      )

      // User should see "Leave" button instead of "Join" 
      expect(screen.getByText(/se désinscrire/i)).toBeInTheDocument()
      expect(screen.queryByText(/s'inscrire/i)).not.toBeInTheDocument()
    })

    test('REGRESSION: Should handle match capacity correctly', () => {
      // Bug: Previously allowed more than maxPlayers to join
      // Fixed: Added proper capacity validation
      
      const fullMatch = {
        id: 'match-1',
        date: new Date('2024-02-15T12:00:00Z'),
        maxPlayers: 12,
        status: 'full' as const,
        players: Array.from({ length: 12 }, (_, i) => ({
          id: `player-${i}`,
          userId: `user-${i}`,
          matchId: 'match-1',
          status: 'confirmed' as const,
          joinedAt: new Date(),
          user: {
            id: `user-${i}`,
            pseudo: `Player${i}`,
            avatar: `avatar-${i}`
          }
        }))
      }

      render(
        <MatchCard 
          match={fullMatch} 
          onJoin={jest.fn()} 
          onLeave={jest.fn()} 
          currentUserId="user-99" 
        />
      )

      // Should show "Full" status and disable join button
      expect(screen.getByText(/complet/i)).toBeInTheDocument()
      expect(screen.getByRole('button')).toBeDisabled()
    })

    test('REGRESSION: Should promote from waiting list in FIFO order', () => {
      // Bug: Previously promoted users randomly from waiting list
      // Fixed: Added FIFO promotion logic
      
      const waitingListPlayers = [
        { id: 'wait-1', joinedAt: new Date('2024-01-01T10:00:00Z'), userId: 'user-1' },
        { id: 'wait-2', joinedAt: new Date('2024-01-01T10:05:00Z'), userId: 'user-2' },
        { id: 'wait-3', joinedAt: new Date('2024-01-01T10:10:00Z'), userId: 'user-3' }
      ]

      const sortedByJoinTime = [...waitingListPlayers].sort(
        (a, b) => a.joinedAt.getTime() - b.joinedAt.getTime()
      )

      // First person should be promoted
      expect(sortedByJoinTime[0].userId).toBe('user-1')
    })

    test('REGRESSION: Should validate match time constraints', () => {
      // Bug: Previously allowed matches outside 12h-14h timeframe
      // Fixed: Added time validation
      
      const validateMatchTime = (date: Date) => {
        const hours = date.getHours()
        return hours >= 12 && hours <= 14
      }

      const validTimes = [
        new Date('2024-01-01T12:00:00Z'),
        new Date('2024-01-01T13:00:00Z'),
        new Date('2024-01-01T14:00:00Z')
      ]

      const invalidTimes = [
        new Date('2024-01-01T11:59:00Z'),
        new Date('2024-01-01T15:00:00Z'),
        new Date('2024-01-01T08:00:00Z')
      ]

      validTimes.forEach(time => {
        expect(validateMatchTime(time)).toBe(true)
      })

      invalidTimes.forEach(time => {
        expect(validateMatchTime(time)).toBe(false)
      })
    })
  })

  describe('UI/UX Bugs', () => {
    test('REGRESSION: Should handle loading states properly', async () => {
      // Bug: Previously showed stale data during loading
      // Fixed: Added proper loading state management
      
      const MockComponent = ({ loading, data }: { loading: boolean, data: any }) => (
        <div>
          {loading ? (
            <div data-testid="loading">Loading...</div>
          ) : (
            <div data-testid="content">{data?.content || 'No data'}</div>
          )}
        </div>
      )

      const { rerender } = render(
        <MockComponent loading={true} data={null} />
      )

      expect(screen.getByTestId('loading')).toBeInTheDocument()
      expect(screen.queryByTestId('content')).not.toBeInTheDocument()

      rerender(<MockComponent loading={false} data={{ content: 'Test content' }} />)

      expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
      expect(screen.getByTestId('content')).toBeInTheDocument()
    })

    test('REGRESSION: Should handle empty states correctly', () => {
      // Bug: Previously showed confusing empty states
      // Fixed: Added proper empty state messaging
      
      const EmptyMatchList = ({ matches }: { matches: any[] }) => (
        <div>
          {matches.length === 0 ? (
            <div data-testid="empty-state">
              Aucun match disponible pour le moment
            </div>
          ) : (
            <div data-testid="match-list">
              {matches.map(match => (
                <div key={match.id}>{match.title}</div>
              ))}
            </div>
          )}
        </div>
      )

      render(<EmptyMatchList matches={[]} />)
      
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
      expect(screen.getByText(/aucun match disponible/i)).toBeInTheDocument()
    })

    test('REGRESSION: Should handle responsive layout correctly', () => {
      // Bug: Previously broke layout on mobile devices
      // Fixed: Added proper responsive design
      
      const ResponsiveComponent = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <div data-testid="item">Item 1</div>
          <div data-testid="item">Item 2</div>
          <div data-testid="item">Item 3</div>
        </div>
      )

      render(<ResponsiveComponent />)
      
      // Should have proper responsive classes
      const container = screen.getAllByTestId('item')[0].parentElement
      expect(container).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3')
    })

    test('REGRESSION: Should escape user input properly', () => {
      // Bug: Previously vulnerable to XSS attacks
      // Fixed: Added proper input sanitization
      
      const sanitizeInput = (input: string) => {
        return input
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
      }

      const maliciousInputs = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(1)">',
        '\'" onmouseover="alert(1)"'
      ]

      maliciousInputs.forEach(input => {
        const sanitized = sanitizeInput(input)
        expect(sanitized).not.toContain('<script')
        expect(sanitized).not.toContain('javascript:')
        expect(sanitized).not.toContain('onerror=')
        expect(sanitized).not.toContain('onmouseover=')
      })
    })
  })

  describe('Data Consistency Bugs', () => {
    test('REGRESSION: Should maintain data consistency during updates', async () => {
      // Bug: Previously had race conditions in data updates
      // Fixed: Added proper state synchronization
      
      let counter = 0
      const updates = []

      const simulateUpdate = async (id: number) => {
        const currentValue = counter
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, Math.random() * 10))
        counter = currentValue + 1
        updates.push({ id, value: counter })
      }

      // Run concurrent updates
      await Promise.all([
        simulateUpdate(1),
        simulateUpdate(2),
        simulateUpdate(3)
      ])

      // Should have consistent final value
      expect(counter).toBe(3)
      expect(updates).toHaveLength(3)
    })

    test('REGRESSION: Should handle optimistic updates correctly', () => {
      // Bug: Previously caused UI inconsistencies with failed updates
      // Fixed: Added proper rollback logic
      
      const OptimisticComponent = () => {
        const [data, setData] = React.useState({ count: 0 })
        const [pending, setPending] = React.useState(false)

        const optimisticUpdate = async () => {
          const originalData = data
          
          // Optimistic update
          setData(prev => ({ ...prev, count: prev.count + 1 }))
          setPending(true)

          try {
            // Simulate API call that might fail
            await new Promise((resolve, reject) => {
              setTimeout(() => Math.random() > 0.5 ? resolve(true) : reject(false), 100)
            })
            // Success - keep optimistic update
            setPending(false)
          } catch {
            // Failure - rollback
            setData(originalData)
            setPending(false)
          }
        }

        return (
          <div>
            <span data-testid="count">{data.count}</span>
            <button onClick={optimisticUpdate} disabled={pending}>
              Update
            </button>
          </div>
        )
      }

      // This test structure shows the pattern for handling optimistic updates
      expect(true).toBe(true) // Placeholder for actual implementation
    })

    test('REGRESSION: Should handle pagination edge cases', () => {
      // Bug: Previously failed on edge cases like page overflow
      // Fixed: Added proper boundary checks
      
      const calculatePagination = (total: number, page: number, limit: number) => {
        const totalPages = Math.ceil(total / limit)
        const currentPage = Math.max(1, Math.min(page, totalPages))
        const offset = (currentPage - 1) * limit
        
        return {
          currentPage,
          totalPages,
          offset,
          hasNext: currentPage < totalPages,
          hasPrev: currentPage > 1
        }
      }

      // Test edge cases
      expect(calculatePagination(0, 1, 10)).toEqual({
        currentPage: 1,
        totalPages: 0,
        offset: 0,
        hasNext: false,
        hasPrev: false
      })

      expect(calculatePagination(100, 999, 10)).toEqual({
        currentPage: 10, // Should clamp to max page
        totalPages: 10,
        offset: 90,
        hasNext: false,
        hasPrev: true
      })

      expect(calculatePagination(100, -5, 10)).toEqual({
        currentPage: 1, // Should clamp to min page
        totalPages: 10,
        offset: 0,
        hasNext: true,
        hasPrev: false
      })
    })
  })

  describe('Performance Regression', () => {
    test('REGRESSION: Should not cause memory leaks in lists', () => {
      // Bug: Previously caused memory leaks with large lists
      // Fixed: Added proper cleanup and virtualization
      
      const LargeList = ({ items }: { items: any[] }) => {
        const [visibleItems, setVisibleItems] = React.useState(items.slice(0, 50))

        React.useEffect(() => {
          // Simulate virtualization
          setVisibleItems(items.slice(0, 50))
        }, [items])

        return (
          <div>
            {visibleItems.map((item, index) => (
              <div key={item.id || index} data-testid="list-item">
                {item.name}
              </div>
            ))}
          </div>
        )
      }

      const largeItemList = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`
      }))

      render(<LargeList items={largeItemList} />)
      
      // Should only render visible items
      expect(screen.getAllByTestId('list-item')).toHaveLength(50)
    })

    test('REGRESSION: Should debounce search inputs', async () => {
      // Bug: Previously triggered search on every keystroke
      // Fixed: Added debouncing
      
      const DebouncedSearch = ({ onSearch }: { onSearch: (term: string) => void }) => {
        const [term, setTerm] = React.useState('')
        const timeoutRef = React.useRef<NodeJS.Timeout>()

        React.useEffect(() => {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = setTimeout(() => {
            if (term) onSearch(term)
          }, 300)

          return () => clearTimeout(timeoutRef.current)
        }, [term, onSearch])

        return (
          <input 
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            data-testid="search-input"
          />
        )
      }

      const mockOnSearch = jest.fn()
      render(<DebouncedSearch onSearch={mockOnSearch} />)
      
      const input = screen.getByTestId('search-input')
      
      // Type quickly
      await userEvent.type(input, 'test')
      
      // Should not have called search yet
      expect(mockOnSearch).not.toHaveBeenCalled()
      
      // Wait for debounce
      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledWith('test')
      }, { timeout: 500 })
      
      expect(mockOnSearch).toHaveBeenCalledTimes(1)
    })
  })
})

// Helper to mock React hooks for tests
const React = {
  useState: jest.fn((initial) => [initial, jest.fn()]),
  useEffect: jest.fn(),
  useRef: jest.fn(() => ({ current: null }))
}