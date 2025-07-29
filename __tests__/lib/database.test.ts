import fs from 'fs'
import path from 'path'

// Mock sqlite3 to avoid real database operations
jest.mock('sqlite3', () => ({
  Database: jest.fn().mockImplementation(() => ({
    run: jest.fn((sql, params, callback) => callback && callback.call({ lastID: 1, changes: 1 })),
    all: jest.fn((sql, params, callback) => callback && callback(null, [])),
    get: jest.fn((sql, params, callback) => callback && callback(null, null)),
    serialize: jest.fn((callback) => callback && callback()),
    close: jest.fn()
  }))
}))

describe('Database Initialization', () => {
  let existsSpy: jest.SpyInstance;
  let mkdirSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules()
    existsSpy = jest.spyOn(fs, 'existsSync')
    mkdirSpy = jest.spyOn(fs, 'mkdirSync')
  })

  it('creates data directory if it does not exist', async () => {
    existsSpy.mockReturnValue(false)
    mkdirSpy.mockImplementation(() => undefined)

    const { database } = await import('@/lib/database')

    expect(existsSpy).toHaveBeenCalledWith(expect.stringContaining(path.join('data')))
    expect(mkdirSpy).toHaveBeenCalledWith(expect.stringContaining('data'), { recursive: true })
    expect(() => database.close()).not.toThrow()
  })

  it('does not recreate directory if it exists', async () => {
    existsSpy.mockReturnValue(true)
    mkdirSpy.mockReset()

    const { database } = await import('@/lib/database')

    expect(existsSpy).toHaveBeenCalledWith(expect.stringContaining('data'))
    expect(mkdirSpy).not.toHaveBeenCalled()
    expect(() => database.close()).not.toThrow()
  })
})

describe('Database Instance API', () => {
  beforeEach(() => jest.resetModules())

  it('provides required methods without error', async () => {
    const { database } = await import('@/lib/database')
    expect(database).toBeDefined()
    expect(typeof database.addMessage).toBe('function')
    expect(typeof database.getMessages).toBe('function')
    expect(typeof database.getConversations).toBe('function')
    expect(typeof database.updateConversation).toBe('function')
    expect(typeof database.incrementUnreadCount).toBe('function')
    expect(typeof database.markConversationAsRead).toBe('function')
    expect(typeof database.close).toBe('function')
  })

  it('initialization errors are handled gracefully', async () => {
    // even without directory, module import should not throw
    const fsModule = await import('fs')
    jest.spyOn(fsModule, 'existsSync').mockReturnValue(false)
    jest.spyOn(fsModule, 'mkdirSync').mockImplementation(() => undefined)
    await expect(import('@/lib/database')).resolves.toBeDefined()
  })
})
