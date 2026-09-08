import { test } from 'vitest'
import { createRejection } from '@/services/createRejection'

test('status is required', () => {
  createRejection({ type: 'Unauthorized', status: 401 })

  // @ts-expect-error a rejection has to say what a server should respond with
  createRejection({ type: 'Unauthorized' })
})
