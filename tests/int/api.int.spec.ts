import { Payload } from 'payload'
import { describe, it, beforeAll, expect } from 'vitest'
import { getTestPayload } from '../helpers/test-db'

let payload: Payload

describe('API', () => {
  beforeAll(async () => {
    // Uses test database configured in test.env
    payload = await getTestPayload()
  })

  it('fetches users', async () => {
    const users = await payload.find({
      collection: 'users',
    })
    expect(users).toBeDefined()
  })
})
