import '@testing-library/jest-dom'

// Mock console methods to catch console errors in tests
const originalError = console.error
const originalWarn = console.warn

beforeEach(() => {
  console.error = jest.fn((...args) => {
    // Allow certain expected errors/warnings
    const message = args[0]?.toString() || ''
    
    // Skip React 18 strict mode warnings
    if (message.includes('Warning: ReactDOM.render is deprecated')) {
      return
    }
    if (message.includes('Warning: componentWillReceiveProps')) {
      return
    }
    
    // Call original console.error for debugging
    originalError(...args)
    
    // Fail the test if there are unexpected console errors
    throw new Error(`Console error: ${message}`)
  })
  
  console.warn = jest.fn((...args) => {
    const message = args[0]?.toString() || ''
    
    // Skip certain expected warnings
    if (message.includes('Warning: React.createFactory')) {
      return
    }
    
    originalWarn(...args)
  })
})

afterEach(() => {
  console.error = originalError
  console.warn = originalWarn
})

// Mock fetch for API calls
global.fetch = jest.fn()

// Mock EventSource for Server-Sent Events
global.EventSource = jest.fn(() => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  close: jest.fn(),
  readyState: 1,
}))

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))
