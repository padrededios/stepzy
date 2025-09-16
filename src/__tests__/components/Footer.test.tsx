import { describe, it, expect } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import { Footer } from '@/components/layout/Footer'

describe('Footer Component', () => {
  it('should render footer with copyright', () => {
    render(<Footer />)

    const currentYear = new Date().getFullYear()
    expect(screen.getByText(new RegExp(String(currentYear)))).toBeInTheDocument()
    expect(screen.getByText(/futsal réservation/i)).toBeInTheDocument()
  })

  it('should render footer links', () => {
    render(<Footer />)

    expect(screen.getByRole('link', { name: /à propos/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /contact/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /conditions/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /confidentialité/i })).toBeInTheDocument()
  })

  it('should have proper structure', () => {
    render(<Footer />)

    const footer = screen.getByRole('contentinfo')
    expect(footer).toBeInTheDocument()
  })

  it('should be sticky at bottom', () => {
    render(<Footer />)

    const footer = screen.getByRole('contentinfo')
    expect(footer).toHaveClass('mt-auto')
  })

  it('should have responsive design classes', () => {
    render(<Footer />)

    const footer = screen.getByRole('contentinfo')
    expect(footer).toHaveClass('bg-gray-50', 'border-t', 'border-gray-200')
  })
})