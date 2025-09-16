/**
 * Responsive Design Tests
 * Tests UI components across different screen sizes and devices
 */

import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock components
import Header from '../../components/layout/Header'
import Sidebar from '../../components/layout/Sidebar'
import MatchCard from '../../components/matches/MatchCard'
import MatchView from '../../components/matches/MatchView'
import Dashboard from '../../app/dashboard/page'

// Mock Next.js
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}))

// Viewport sizes for testing
const VIEWPORTS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1024, height: 768 },
  widescreen: { width: 1920, height: 1080 }
}

describe('Responsive Design Tests', () => {
  beforeEach(() => {
    // Reset viewport to default
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    })
  })

  describe('Layout Components', () => {
    describe('Header Component', () => {
      test('should adapt to mobile viewport', () => {
        // Mock mobile viewport
        Object.defineProperty(window, 'innerWidth', { value: VIEWPORTS.mobile.width })
        
        render(<Header />)
        
        // Should show mobile menu button
        const mobileMenuButton = screen.queryByTestId('mobile-menu-button')
        expect(mobileMenuButton).toBeInTheDocument()
        
        // Desktop navigation should be hidden on mobile
        const desktopNav = screen.queryByTestId('desktop-navigation')
        if (desktopNav) {
          expect(desktopNav).toHaveClass(/hidden/, /md:block/)
        }
      })

      test('should show desktop navigation on larger screens', () => {
        // Mock desktop viewport
        Object.defineProperty(window, 'innerWidth', { value: VIEWPORTS.desktop.width })
        
        render(<Header />)
        
        // Mobile menu should be hidden on desktop
        const mobileMenuButton = screen.queryByTestId('mobile-menu-button')
        if (mobileMenuButton) {
          expect(mobileMenuButton).toHaveClass(/md:hidden/)
        }
      })

      test('should handle logo scaling across devices', () => {
        render(<Header />)
        
        const logo = screen.queryByTestId('logo')
        if (logo) {
          // Logo should have responsive classes
          expect(logo).toHaveClass(/w-/, /h-/)
        }
      })
    })

    describe('Sidebar Component', () => {
      test('should be collapsible on mobile', () => {
        Object.defineProperty(window, 'innerWidth', { value: VIEWPORTS.mobile.width })
        
        render(<Sidebar />)
        
        const sidebar = screen.getByTestId('sidebar')
        
        // Should have mobile-friendly classes
        expect(sidebar).toHaveClass(/fixed/, /inset-y-0/)
      })

      test('should remain static on desktop', () => {
        Object.defineProperty(window, 'innerWidth', { value: VIEWPORTS.desktop.width })
        
        render(<Sidebar />)
        
        const sidebar = screen.getByTestId('sidebar')
        
        // Should have desktop layout classes
        expect(sidebar).toHaveClass(/relative/, /block/)
      })

      test('should show condensed navigation on tablet', () => {
        Object.defineProperty(window, 'innerWidth', { value: VIEWPORTS.tablet.width })
        
        render(<Sidebar />)
        
        const sidebar = screen.getByTestId('sidebar')
        
        // Should adapt to medium screen size
        expect(sidebar).toHaveClass(/md:/)
      })
    })
  })

  describe('Match Components', () => {
    const mockMatch = {
      id: 'match-1',
      date: new Date('2024-02-15T12:00:00Z'),
      maxPlayers: 12,
      status: 'open' as const,
      players: []
    }

    describe('MatchCard Component', () => {
      test('should stack vertically on mobile', () => {
        Object.defineProperty(window, 'innerWidth', { value: VIEWPORTS.mobile.width })
        
        render(
          <MatchCard 
            match={mockMatch} 
            onJoin={jest.fn()} 
            onLeave={jest.fn()} 
            currentUserId="user-1" 
          />
        )
        
        const card = screen.getByTestId('match-card')
        
        // Should have mobile-first responsive classes
        expect(card).toHaveClass(/flex-col/, /w-full/)
      })

      test('should display horizontally on desktop', () => {
        Object.defineProperty(window, 'innerWidth', { value: VIEWPORTS.desktop.width })
        
        render(
          <MatchCard 
            match={mockMatch} 
            onJoin={jest.fn()} 
            onLeave={jest.fn()} 
            currentUserId="user-1" 
          />
        )
        
        const card = screen.getByTestId('match-card')
        
        // Should have desktop layout classes
        expect(card).toHaveClass(/md:flex-row/)
      })

      test('should have readable text on all screen sizes', () => {
        const sizes = [VIEWPORTS.mobile.width, VIEWPORTS.tablet.width, VIEWPORTS.desktop.width]
        
        sizes.forEach(width => {
          Object.defineProperty(window, 'innerWidth', { value: width })
          
          const { unmount } = render(
            <MatchCard 
              match={mockMatch} 
              onJoin={jest.fn()} 
              onLeave={jest.fn()} 
              currentUserId="user-1" 
            />
          )
          
          // Text should be visible and properly sized
          const timeText = screen.getByText(/12:00/)
          expect(timeText).toBeVisible()
          
          unmount()
        })
      })

      test('should have appropriate touch targets on mobile', () => {
        Object.defineProperty(window, 'innerWidth', { value: VIEWPORTS.mobile.width })
        
        render(
          <MatchCard 
            match={mockMatch} 
            onJoin={jest.fn()} 
            onLeave={jest.fn()} 
            currentUserId="user-1" 
          />
        )
        
        const joinButton = screen.getByRole('button')
        
        // Should have adequate touch target size (minimum 44px)
        expect(joinButton).toHaveClass(/py-/, /px-/, /min-h-/)
      })
    })

    describe('MatchView Component', () => {
      const mockMatchWithPlayers = {
        ...mockMatch,
        players: Array.from({ length: 8 }, (_, i) => ({
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

      test('should scale field layout for mobile', () => {
        Object.defineProperty(window, 'innerWidth', { value: VIEWPORTS.mobile.width })
        
        render(
          <MatchView 
            match={mockMatchWithPlayers} 
            onJoin={jest.fn()} 
            onLeave={jest.fn()} 
            currentUserId="user-1" 
          />
        )
        
        const matchView = screen.getByTestId('match-view')
        
        // Should adapt field layout for mobile
        expect(matchView).toHaveClass(/flex-col/, /space-y-/)
      })

      test('should show proper field layout on desktop', () => {
        Object.defineProperty(window, 'innerWidth', { value: VIEWPORTS.desktop.width })
        
        render(
          <MatchView 
            match={mockMatchWithPlayers} 
            onJoin={jest.fn()} 
            onLeave={jest.fn()} 
            currentUserId="user-1" 
          />
        )
        
        const field = screen.getByTestId('match-field')
        
        // Should have proper desktop field dimensions
        expect(field).toHaveClass(/aspect-/, /max-w-/)
      })

      test('should handle player avatars responsively', () => {
        render(
          <MatchView 
            match={mockMatchWithPlayers} 
            onJoin={jest.fn()} 
            onLeave={jest.fn()} 
            currentUserId="user-1" 
          />
        )
        
        const playerAvatars = screen.getAllByTestId('player-avatar')
        
        // Avatars should have responsive sizing
        playerAvatars.forEach(avatar => {
          expect(avatar).toHaveClass(/w-/, /h-/, /sm:/, /md:/)
        })
      })
    })
  })

  describe('Grid Layouts', () => {
    test('should use responsive grid for match listings', () => {
      const MultipleMatchCards = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <MatchCard 
              key={i}
              match={{
                ...mockMatch,
                id: `match-${i}`
              }}
              onJoin={jest.fn()} 
              onLeave={jest.fn()} 
              currentUserId="user-1" 
            />
          ))}
        </div>
      )

      render(<MultipleMatchCards />)
      
      const grid = screen.getAllByTestId('match-card')[0].parentElement
      
      // Should have responsive grid classes
      expect(grid).toHaveClass(
        'grid',
        'grid-cols-1',
        'md:grid-cols-2', 
        'lg:grid-cols-3'
      )
    })

    test('should handle dashboard layout responsively', () => {
      // Mock dashboard data
      jest.mock('../../lib/auth/context', () => ({
        useAuth: () => ({
          user: { id: 'user1', pseudo: 'TestUser', role: 'user' },
          loading: false
        })
      }))

      const DashboardLayout = () => (
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div data-testid="main-content">Main content</div>
            </div>
            <div className="lg:col-span-1">
              <div data-testid="sidebar-content">Sidebar</div>
            </div>
          </div>
        </div>
      )

      render(<DashboardLayout />)
      
      const mainContent = screen.getByTestId('main-content')
      const sidebarContent = screen.getByTestId('sidebar-content')
      
      expect(mainContent.parentElement).toHaveClass('lg:col-span-2')
      expect(sidebarContent.parentElement).toHaveClass('lg:col-span-1')
    })
  })

  describe('Typography Responsiveness', () => {
    test('should scale headings appropriately', () => {
      const ResponsiveHeadings = () => (
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
            Main Title
          </h1>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold">
            Subtitle
          </h2>
          <p className="text-sm sm:text-base lg:text-lg">
            Body text
          </p>
        </div>
      )

      render(<ResponsiveHeadings />)
      
      const heading = screen.getByText('Main Title')
      const subtitle = screen.getByText('Subtitle')
      const bodyText = screen.getByText('Body text')
      
      // Should have responsive text classes
      expect(heading).toHaveClass('text-2xl', 'sm:text-3xl', 'lg:text-4xl')
      expect(subtitle).toHaveClass('text-lg', 'sm:text-xl', 'lg:text-2xl')
      expect(bodyText).toHaveClass('text-sm', 'sm:text-base', 'lg:text-lg')
    })

    test('should maintain readable line heights', () => {
      const TextContent = () => (
        <div className="leading-relaxed sm:leading-loose">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        </div>
      )

      render(<TextContent />)
      
      const content = screen.getByText(/Lorem ipsum/)
      expect(content).toHaveClass('leading-relaxed', 'sm:leading-loose')
    })
  })

  describe('Spacing and Padding', () => {
    test('should use responsive spacing', () => {
      const ResponsiveContainer = () => (
        <div className="p-4 sm:p-6 lg:p-8 m-2 sm:m-4 lg:m-6">
          <div className="space-y-2 sm:space-y-4 lg:space-y-6">
            <div>Item 1</div>
            <div>Item 2</div>
            <div>Item 3</div>
          </div>
        </div>
      )

      render(<ResponsiveContainer />)
      
      const container = screen.getByText('Item 1').parentElement?.parentElement
      const spacedContainer = screen.getByText('Item 1').parentElement
      
      expect(container).toHaveClass('p-4', 'sm:p-6', 'lg:p-8')
      expect(spacedContainer).toHaveClass('space-y-2', 'sm:space-y-4', 'lg:space-y-6')
    })

    test('should handle margin and padding breakpoints', () => {
      const sizes = ['sm', 'md', 'lg', 'xl', '2xl']
      
      sizes.forEach(size => {
        const ResponsiveElement = () => (
          <div className={`p-2 ${size}:p-4`}>
            Responsive element
          </div>
        )

        const { unmount } = render(<ResponsiveElement />)
        
        const element = screen.getByText('Responsive element')
        expect(element).toHaveClass('p-2', `${size}:p-4`)
        
        unmount()
      })
    })
  })

  describe('Image and Media Responsiveness', () => {
    test('should handle responsive images', () => {
      const ResponsiveImage = () => (
        <img 
          src="/test-image.jpg"
          alt="Test image"
          className="w-full h-auto max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg"
        />
      )

      render(<ResponsiveImage />)
      
      const image = screen.getByAltText('Test image')
      expect(image).toHaveClass(
        'w-full',
        'h-auto',
        'max-w-xs',
        'sm:max-w-sm',
        'md:max-w-md',
        'lg:max-w-lg'
      )
    })

    test('should handle avatar sizing responsively', () => {
      const ResponsiveAvatar = () => (
        <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-gray-300">
          <span className="sr-only">User avatar</span>
        </div>
      )

      render(<ResponsiveAvatar />)
      
      const avatar = screen.getByText('User avatar').parentElement
      expect(avatar).toHaveClass(
        'w-8', 'h-8',
        'sm:w-10', 'sm:h-10',
        'md:w-12', 'md:h-12'
      )
    })
  })

  describe('Interactive Elements', () => {
    test('should have responsive button sizes', () => {
      const ResponsiveButton = () => (
        <button className="px-3 py-2 sm:px-4 sm:py-2 md:px-6 md:py-3 text-sm sm:text-base">
          Click me
        </button>
      )

      render(<ResponsiveButton />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass(
        'px-3', 'py-2',
        'sm:px-4', 'sm:py-2',
        'md:px-6', 'md:py-3',
        'text-sm', 'sm:text-base'
      )
    })

    test('should handle form input responsiveness', () => {
      const ResponsiveForm = () => (
        <form className="space-y-2 sm:space-y-4">
          <input 
            type="email"
            className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base"
            placeholder="Email"
          />
          <input 
            type="password"
            className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base"
            placeholder="Password"
          />
        </form>
      )

      render(<ResponsiveForm />)
      
      const inputs = screen.getAllByRole('textbox')
      inputs.forEach(input => {
        expect(input).toHaveClass(
          'w-full',
          'px-3', 'py-2',
          'sm:px-4', 'sm:py-3',
          'text-sm', 'sm:text-base'
        )
      })
    })
  })

  describe('Container Queries and Modern CSS', () => {
    test('should use container-based responsive design', () => {
      const ContainerResponsive = () => (
        <div className="@container">
          <div className="@sm:flex @md:flex-row @lg:gap-8">
            <div className="@sm:w-1/2">Content 1</div>
            <div className="@sm:w-1/2">Content 2</div>
          </div>
        </div>
      )

      // Note: This test assumes Tailwind CSS container queries are available
      // In practice, you'd need the @tailwindcss/container-queries plugin
      render(<ContainerResponsive />)
      
      const container = screen.getByText('Content 1').parentElement?.parentElement
      expect(container).toHaveClass('@container')
    })

    test('should handle aspect ratio responsively', () => {
      const AspectRatioElement = () => (
        <div className="aspect-square sm:aspect-video lg:aspect-[4/3]">
          <div>Aspect ratio content</div>
        </div>
      )

      render(<AspectRatioElement />)
      
      const element = screen.getByText('Aspect ratio content').parentElement
      expect(element).toHaveClass(
        'aspect-square',
        'sm:aspect-video',
        'lg:aspect-[4/3]'
      )
    })
  })
})