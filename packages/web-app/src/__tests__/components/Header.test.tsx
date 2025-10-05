import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Header } from '@/components/layout/Header'

// Mock next/navigation
const mockPush = jest.fn()
const mockReplace = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}))

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    return <img {...props} alt={props.alt} />
  },
}))

// Mock fetch for logout
global.fetch = jest.fn()

describe('Header Component', () => {
  const user = userEvent.setup()
  
  const mockUser = {
    id: 'user-1',
    email: 'user@example.com',
    pseudo: 'TestUser',
    avatar: 'https://example.com/avatar.jpg',
    role: 'user' as const
  }
  
  const mockAdminUser = {
    ...mockUser,
    role: 'root' as const,
    pseudo: 'AdminUser'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  it('should render header for unauthenticated user', () => {
    render(<Header user={null} />)

    expect(screen.getByText(/futsal réservation/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /se connecter/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /s'inscrire/i })).toBeInTheDocument()
  })

  it('should render header for authenticated user', () => {
    render(<Header user={mockUser} />)

    expect(screen.getByText(/futsal réservation/i)).toBeInTheDocument()
    expect(screen.getByText(mockUser.pseudo)).toBeInTheDocument()
    expect(screen.getByAltText(/avatar/i)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /se connecter/i })).not.toBeInTheDocument()
  })

  it('should show admin link for admin users', () => {
    render(<Header user={mockAdminUser} />)

    expect(screen.getByRole('link', { name: /administration/i })).toBeInTheDocument()
  })

  it('should not show admin link for regular users', () => {
    render(<Header user={mockUser} />)

    expect(screen.queryByRole('link', { name: /administration/i })).not.toBeInTheDocument()
  })

  it('should open user menu when clicking on avatar', async () => {
    render(<Header user={mockUser} />)

    const avatarButton = screen.getByRole('button', { name: /ouvrir le menu utilisateur/i })
    await user.click(avatarButton)

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /profil/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /se déconnecter/i })).toBeInTheDocument()
    })
  })

  it('should close user menu when clicking outside', async () => {
    render(<Header user={mockUser} />)

    const avatarButton = screen.getByRole('button', { name: /ouvrir le menu utilisateur/i })
    await user.click(avatarButton)

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /profil/i })).toBeInTheDocument()
    })

    // Click outside the menu
    await user.click(document.body)

    await waitFor(() => {
      expect(screen.queryByRole('link', { name: /profil/i })).not.toBeInTheDocument()
    })
  })

  it('should handle logout', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    })

    render(<Header user={mockUser} />)

    const avatarButton = screen.getByRole('button', { name: /ouvrir le menu utilisateur/i })
    await user.click(avatarButton)

    const logoutButton = screen.getByRole('button', { name: /se déconnecter/i })
    await user.click(logoutButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
    })

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login')
    })
  })

  it('should handle logout errors gracefully', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

    render(<Header user={mockUser} />)

    const avatarButton = screen.getByRole('button', { name: /ouvrir le menu utilisateur/i })
    await user.click(avatarButton)

    const logoutButton = screen.getByRole('button', { name: /se déconnecter/i })
    await user.click(logoutButton)

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login')
    })
  })

  it('should show mobile menu toggle', () => {
    render(<Header user={mockUser} />)

    expect(screen.getByRole('button', { name: /ouvrir le menu mobile/i })).toBeInTheDocument()
  })

  it('should toggle mobile menu', async () => {
    render(<Header user={mockUser} />)

    const mobileMenuButton = screen.getByRole('button', { name: /ouvrir le menu mobile/i })
    
    // Initially closed
    expect(screen.queryByRole('navigation', { name: /menu mobile/i })).not.toBeInTheDocument()

    await user.click(mobileMenuButton)

    await waitFor(() => {
      expect(screen.getByRole('navigation', { name: /menu mobile/i })).toBeInTheDocument()
    })

    await user.click(mobileMenuButton)

    await waitFor(() => {
      expect(screen.queryByRole('navigation', { name: /menu mobile/i })).not.toBeInTheDocument()
    })
  })

  it('should navigate to home when clicking logo', async () => {
    render(<Header user={mockUser} />)

    const logoLink = screen.getByRole('link', { name: /accueil/i })
    expect(logoLink).toHaveAttribute('href', '/dashboard')
  })

  it('should display correct navigation links for authenticated users', () => {
    render(<Header user={mockUser} />)

    expect(screen.getByRole('link', { name: /matchs/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /planning/i })).toBeInTheDocument()
  })
})