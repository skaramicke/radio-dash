import { render, screen } from '@testing-library/react'
import MessageComponent from '@/components/MessageComponent'
import { Message } from '@/lib/database'

describe('MessageComponent', () => {
  const mockMessage: Message = {
    id: 1,
    conversation: 'KC1ABC',
    from: 'KC1ABC',
    to: 'KD2DEF',
    text: 'Hello World!',
    timestamp: 1640995200000, // Jan 1, 2022 00:00:00 GMT
    snr: 15,
    frequency: 14078000,
    direction: 'incoming',
    isRead: true
  }

  it('renders incoming message correctly', () => {
    render(<MessageComponent message={mockMessage} isOwnMessage={false} />)
    
    expect(screen.getByText('KC1ABC')).toBeInTheDocument()
    expect(screen.getByText('Hello World!')).toBeInTheDocument()
    expect(screen.getByText('+15 dB')).toBeInTheDocument()
  })

  it('renders outgoing message correctly', () => {
    render(<MessageComponent message={mockMessage} isOwnMessage={true} />)
    
    expect(screen.getByText('You')).toBeInTheDocument()
    expect(screen.getByText('Hello World!')).toBeInTheDocument()
    expect(screen.queryByText('KC1ABC')).not.toBeInTheDocument()
  })

  it('formats timestamp correctly', () => {
    render(<MessageComponent message={mockMessage} isOwnMessage={false} />)
    
    // Should show time in format like "12:00 AM" or "00:00" depending on locale
    const timeElement = screen.getByText(/^\d{1,2}:\d{2}/)
    expect(timeElement).toBeInTheDocument()
  })

  it('displays SNR when present', () => {
    render(<MessageComponent message={mockMessage} isOwnMessage={false} />)
    
    expect(screen.getByText('+15 dB')).toBeInTheDocument()
  })

  it('handles negative SNR correctly', () => {
    const messageWithNegativeSNR = { ...mockMessage, snr: -5 }
    render(<MessageComponent message={messageWithNegativeSNR} isOwnMessage={false} />)
    
    expect(screen.getByText('-5 dB')).toBeInTheDocument()
  })

  it('does not display SNR when not present', () => {
    const messageWithoutSNR = { ...mockMessage, snr: undefined }
    render(<MessageComponent message={messageWithoutSNR} isOwnMessage={false} />)
    
    expect(screen.queryByText(/dB/)).not.toBeInTheDocument()
  })

  it('applies correct styling for incoming messages', () => {
    const { container } = render(<MessageComponent message={mockMessage} isOwnMessage={false} />)
    
    const messageContainer = container.querySelector('.justify-start')
    expect(messageContainer).toBeInTheDocument()
    
    const messageBox = container.querySelector('.bg-gray-700')
    expect(messageBox).toBeInTheDocument()
  })

  it('applies correct styling for outgoing messages', () => {
    const { container } = render(<MessageComponent message={mockMessage} isOwnMessage={true} />)
    
    const messageContainer = container.querySelector('.justify-end')
    expect(messageContainer).toBeInTheDocument()
    
    const messageBox = container.querySelector('.bg-blue-600')
    expect(messageBox).toBeInTheDocument()
  })

  it('handles multiline text correctly', () => {
    const multilineMessage = { ...mockMessage, text: 'Line 1\nLine 2\nLine 3' }
    render(<MessageComponent message={multilineMessage} isOwnMessage={false} />)
    
    // The text might be split across elements due to whitespace-pre-wrap
    expect(screen.getByText((content, element) => {
      return element?.textContent === 'Line 1\nLine 2\nLine 3'
    })).toBeInTheDocument()
  })

  it('does not generate console errors', () => {
    expect(() => {
      render(<MessageComponent message={mockMessage} isOwnMessage={false} />)
    }).not.toThrow()
    
    expect(() => {
      render(<MessageComponent message={mockMessage} isOwnMessage={true} />)
    }).not.toThrow()
  })

  it('handles missing message data gracefully', () => {
    const minimalMessage: Message = {
      conversation: 'TEST',
      from: 'TEST',
      to: 'TEST',
      text: 'Test',
      timestamp: Date.now(),
      direction: 'incoming',
      isRead: true
    }
    
    expect(() => {
      render(<MessageComponent message={minimalMessage} isOwnMessage={false} />)
    }).not.toThrow()
  })
})
