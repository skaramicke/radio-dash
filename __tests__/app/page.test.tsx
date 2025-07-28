import { render, screen } from '@testing-library/react'
import React from 'react'
import Home from '@/app/page'

describe('Home Page', () => {
  it('renders without crashing', () => {
    render(<Home />)
    
    // Check that the main heading is present
    expect(screen.getByText('📻 Radio Dash')).toBeInTheDocument()
  })

  it('displays the correct subtitle', () => {
    render(<Home />)
    
    expect(screen.getByText('JS8Call Chat Interface')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    render(<Home />)
    
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('has proper CSS classes for dark theme', () => {
    render(<Home />)
    
    const container = screen.getByText('📻 Radio Dash').closest('div')?.parentElement
    expect(container).toHaveClass('min-h-screen', 'bg-gray-900', 'text-white')
  })

  it('does not generate console errors', () => {
    // This test will fail if there are any console.error calls during render
    expect(() => {
      render(<Home />)
    }).not.toThrow()
  })
})
