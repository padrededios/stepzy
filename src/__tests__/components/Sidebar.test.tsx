import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Sidebar } from '@/components/layout/Sidebar'

// Mock next/navigation
const mockPathname = '/dashboard'
jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}))

describe('Sidebar Component', () => {
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
  })

  it('should render sidebar for authenticated user', () => {
    render(<Sidebar user={mockUser} isOpen={true} onClose={() => {}} />)

    expect(screen.getByRole('navigation', { name: /menu principal/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /tableau de bord/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /matchs/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /planning/i })).toBeInTheDocument()
  })

  it('should show admin links for admin users', () => {
    render(<Sidebar user={mockAdminUser} isOpen={true} onClose={() => {}} />)

    expect(screen.getByRole('link', { name: /administration/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /gestion utilisateurs/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /gestion matchs/i })).toBeInTheDocument()
  })

  it('should not show admin links for regular users', () => {
    render(<Sidebar user={mockUser} isOpen={true} onClose={() => {}} />)

    expect(screen.queryByRole('link', { name: /administration/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /gestion utilisateurs/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /gestion matchs/i })).not.toBeInTheDocument()
  })

  it('should highlight active link', () => {
    // Mock pathname to dashboard
    jest.doMock('next/navigation', () => ({
      usePathname: () => '/dashboard',
    }))

    render(<Sidebar user={mockUser} isOpen={true} onClose={() => {}} />)

    const dashboardLink = screen.getByRole('link', { name: /tableau de bord/i })
    expect(dashboardLink).toHaveClass('bg-blue-50', 'text-blue-700')
  })

  it('should not be visible when closed', () => {
    render(<Sidebar user={mockUser} isOpen={false} onClose={() => {}} />)

    const sidebar = screen.getByRole('navigation', { name: /menu principal/i })
    expect(sidebar).toHaveClass('-translate-x-full')
  })

  it('should be visible when open', () => {
    render(<Sidebar user={mockUser} isOpen={true} onClose={() => {}} />)

    const sidebar = screen.getByRole('navigation', { name: /menu principal/i })
    expect(sidebar).toHaveClass('translate-x-0')
  })

  it('should call onClose when clicking overlay', async () => {
    const mockOnClose = jest.fn()
    render(<Sidebar user={mockUser} isOpen={true} onClose={mockOnClose} />)

    const overlay = screen.getByRole('button', { name: /fermer le menu/i })
    await user.click(overlay)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should show user info at the bottom', () => {
    render(<Sidebar user={mockUser} isOpen={true} onClose={() => {}} />)

    expect(screen.getByText(mockUser.pseudo)).toBeInTheDocument()
    expect(screen.getByText(mockUser.email)).toBeInTheDocument()
  })

  it('should group navigation items correctly', () => {
    render(<Sidebar user={mockAdminUser} isOpen={true} onClose={() => {}} />)

    // Main navigation
    expect(screen.getByText(/navigation principale/i)).toBeInTheDocument()
    
    // Admin section
    expect(screen.getByText(/administration/i)).toBeInTheDocument()
  })

  it('should handle missing user gracefully', () => {
    render(<Sidebar user={null} isOpen={true} onClose={() => {}} />)

    expect(screen.queryByRole('navigation', { name: /menu principal/i })).not.toBeInTheDocument()
  })

  it('should have proper accessibility attributes', () => {
    render(<Sidebar user={mockUser} isOpen={true} onClose={() => {}} />)

    const sidebar = screen.getByRole('navigation', { name: /menu principal/i })
    expect(sidebar).toHaveAttribute('aria-label', 'Menu principal')
  })
})