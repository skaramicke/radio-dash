import { render, screen } from '@testing-library/react'
import ConnectionStatus from '@/components/ConnectionStatus'

describe('ConnectionStatus', () => {
  const mockStationInfo = {
    callsign: 'KC1ABC',
    grid: 'FN42',
    frequency: 14078000
  }

  it('renders disconnected state correctly', () => {
    render(<ConnectionStatus isConnected={false} stationInfo={null} />)
    
    expect(screen.getByText('Disconnected')).toBeInTheDocument()
    expect(screen.getByText('Disconnected')).toHaveClass('text-red-400')
  })

  it('renders connected state correctly', () => {
    render(<ConnectionStatus isConnected={true} stationInfo={mockStationInfo} />)
    
    expect(screen.getByText('Connected')).toBeInTheDocument()
    expect(screen.getByText('Connected')).toHaveClass('text-green-400')
  })

  it('displays station info when connected', () => {
    render(<ConnectionStatus isConnected={true} stationInfo={mockStationInfo} />)
    
    expect(screen.getByText('KC1ABC')).toBeInTheDocument()
    expect(screen.getByText('FN42')).toBeInTheDocument()
    expect(screen.getByText('14.078 MHz')).toBeInTheDocument()
  })

  it('does not display station info when disconnected', () => {
    render(<ConnectionStatus isConnected={false} stationInfo={mockStationInfo} />)
    
    expect(screen.queryByText('KC1ABC')).not.toBeInTheDocument()
    expect(screen.queryByText('FN42')).not.toBeInTheDocument()
    expect(screen.queryByText('14.078 MHz')).not.toBeInTheDocument()
  })

  it('does not display station info when connected but stationInfo is null', () => {
    render(<ConnectionStatus isConnected={true} stationInfo={null} />)
    
    expect(screen.getByText('Connected')).toBeInTheDocument()
    expect(screen.queryByText('KC1ABC')).not.toBeInTheDocument()
  })

  it('formats frequencies correctly in MHz', () => {
    const highFreqStation = { ...mockStationInfo, frequency: 28074500 }
    render(<ConnectionStatus isConnected={true} stationInfo={highFreqStation} />)
    
    expect(screen.getByText('28.075 MHz')).toBeInTheDocument()
  })

  it('formats frequencies correctly in kHz for lower frequencies', () => {
    const lowFreqStation = { ...mockStationInfo, frequency: 500000 }
    render(<ConnectionStatus isConnected={true} stationInfo={lowFreqStation} />)
    
    expect(screen.getByText('500.0 kHz')).toBeInTheDocument()
  })

  it('has proper styling for connection indicator', () => {
    const { rerender } = render(<ConnectionStatus isConnected={true} stationInfo={mockStationInfo} />)
    
    const indicator = document.querySelector('.w-2.h-2.rounded-full')
    expect(indicator).toHaveClass('bg-green-400', 'animate-pulse')
    
    rerender(<ConnectionStatus isConnected={false} stationInfo={null} />)
    
    const disconnectedIndicator = document.querySelector('.w-2.h-2.rounded-full')
    expect(disconnectedIndicator).toHaveClass('bg-red-400')
    expect(disconnectedIndicator).not.toHaveClass('animate-pulse')
  })

  it('does not generate console errors', () => {
    expect(() => {
      render(<ConnectionStatus isConnected={true} stationInfo={mockStationInfo} />)
    }).not.toThrow()
    
    expect(() => {
      render(<ConnectionStatus isConnected={false} stationInfo={null} />)
    }).not.toThrow()
  })

  it('handles edge case of zero frequency', () => {
    const zeroFreqStation = { ...mockStationInfo, frequency: 0 }
    
    expect(() => {
      render(<ConnectionStatus isConnected={true} stationInfo={zeroFreqStation} />)
    }).not.toThrow()
    
    expect(screen.getByText('0.0 kHz')).toBeInTheDocument()
  })
})
