// Test setup - loads test.env for integration tests
import { config } from 'dotenv'
import { resolve } from 'path'

// Load test.env file (NOT .env)
config({ path: resolve(process.cwd(), 'test.env') })

// Set test environment flag
process.env.VITEST = 'true'

// Log which database we're using (for debugging)
console.log('[TEST ENV] Using database:', process.env.DATABASE_URL?.split('@')[1] || 'unknown')
