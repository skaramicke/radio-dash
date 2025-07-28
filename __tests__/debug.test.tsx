import { render, screen } from '@testing-library/react'

// Test direct file reading vs import
describe('Direct Component Test', () => {
  it('can render a React component created inline', () => {
    const TestComponent = () => (
      <div>
        <h1>Test Component</h1>
      </div>
    )
    
    render(<TestComponent />)
    expect(screen.getByText('Test Component')).toBeTruthy()
  })

  it('tests file system and module resolution', async () => {
    // Test if we can read the file content directly
    const fs = require('fs')
    const path = require('path')
    
    const filePath = path.join(process.cwd(), 'app', 'page.tsx')
    const fileExists = fs.existsSync(filePath)
    expect(fileExists).toBe(true)
    
    if (fileExists) {
      const content = fs.readFileSync(filePath, 'utf8')
      console.log('File content length:', content.length)
      console.log('File contains export default:', content.includes('export default'))
      console.log('File contains function:', content.includes('function'))
    }
  })
})
