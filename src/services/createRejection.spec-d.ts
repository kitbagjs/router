import { test } from 'vitest'
import { createRejection } from '@/services/createRejection'

test('status is optional', () => {
  createRejection({ type: 'Unauthorized', status: 401 })

  createRejection({ type: 'Unauthorized' })
})
