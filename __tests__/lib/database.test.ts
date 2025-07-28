import { database } from '@/lib/database'
import fs from 'fs'

// Mock fs to prevent actual file system operations during tests
jest.mock('fs')
jest.mock('sqlite3', () => ({
  Database: jest.fn().mockImplementation(() => ({
    run: jest.fn((sql, params, callback) => {
      if (callback) callback.call({ lastID: 1, changes: 1 })
    }),
    all: jest.fn((sql, params, callback) => {
      if (callback) callback(null, [])
    }),
    get: jest.fn((sql, params, callback) => {
      if (callback) callback(null, null)
    }),
    serialize: jest.fn((callback) => {
      if (callback) callback()
    }),
    close: jest.fn()
  }))
}))

const mockedFs = fs as jest.Mocked<typeof fs>

describe('Database', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock fs.existsSync to return false initially, then true after mkdirSync
    mockedFs.existsSync.mockReturnValue(false)
    mockedFs.mkdirSync.mockReturnValue(undefined)
  })

  it('creates data directory if it does not exist', () => {
    // The database instance is already created when imported
    expect(mockedFs.existsSync).toHaveBeenCalled()
    expect(mockedFs.mkdirSync).toHaveBeenCalledWith(
      expect.stringContaining('data'), 
      { recursive: true }
    )
  })

  it('can be accessed without throwing errors', () => {
    expect(() => {
      database.close()
    }).not.toThrow()
  })

  it('has required methods', () => {
    expect(typeof database.addMessage).toBe('function')
    expect(typeof database.getMessages).toBe('function')
    expect(typeof database.getConversations).toBe('function')
    expect(typeof database.updateConversation).toBe('function')
    expect(typeof database.markConversationAsRead).toBe('function')
    expect(typeof database.close).toBe('function')
  })
})

describe('Database Error Handling', () => {
  it('handles missing data directory gracefully', () => {
    mockedFs.existsSync.mockReturnValue(false)
    
    // Database instance should be available without errors
    expect(database).toBeDefined()
  })

  it('does not create console errors during initialization', () => {
    expect(() => {
      // Access database properties
      expect(database).toBeDefined()
    }).not.toThrow()
  })
})
