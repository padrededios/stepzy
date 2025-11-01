/**
 * Jest setup file
 * Runs before all tests
 */

import dotenv from 'dotenv'
import path from 'path'

// Load .env file from packages/backend directory
dotenv.config({ path: path.resolve(__dirname, '.env') })

// Set test environment variables
process.env.NODE_ENV = 'test'
// Use TEST database URL if available, otherwise use regular DATABASE_URL
if (!process.env.DATABASE_URL && !process.env.DATABASE_URL_TEST) {
  // Fallback to default test database
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/stepzy_test'
}
process.env.BETTER_AUTH_SECRET = 'test-secret-key-for-testing-only'
process.env.BETTER_AUTH_URL = 'http://localhost:3001'
process.env.FRONTEND_URL = 'http://localhost:3000'

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}

// Set longer timeout for integration tests
jest.setTimeout(30000)
